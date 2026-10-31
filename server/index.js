const http = require('node:http');
const mysql = require('mysql2/promise');
const { createClient } = require('redis');

const PORT = Number(process.env.PORT || 3000);
const BODY_LIMIT = parseBodyLimit(process.env.API_BODY_LIMIT || '32mb');
const CACHE_KEY = 'products:v1';
const CACHE_TTL_SECONDS = 300;

function parseBodyLimit(value) {
	const match = /^([0-9]+)(kb|mb|gb)?$/i.exec(value);
	if (!match) throw new Error('API_BODY_LIMIT deve usar bytes, kb, mb ou gb.');
	const units = { kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };
	return Number(match[1]) * (units[match[2]?.toLowerCase()] || 1);
}

class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT || 3306),
	database: process.env.DB_NAME,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	waitForConnections: true,
	connectionLimit: 10,
	charset: 'utf8mb4'
});

const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', error => console.error('Redis:', error.message));

function sendJson(response, status, value) {
	response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
	response.end(JSON.stringify(value));
}

function readJson(request) {
	return new Promise((resolve, reject) => {
		let size = 0;
		let tooLarge = false;
		const chunks = [];

		request.on('data', chunk => {
			size += chunk.length;
			if (size > BODY_LIMIT) {
				tooLarge = true;
				chunks.length = 0;
			} else if (!tooLarge) {
				chunks.push(chunk);
			}
		});
		request.on('end', () => {
			if (tooLarge) return reject(new HttpError(413, 'Corpo da requisição excede o limite permitido.'));
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
			} catch {
				reject(new HttpError(400, 'JSON inválido.'));
			}
		});
		request.on('error', reject);
	});
}

async function getProducts() {
	const cached = await redis.get(CACHE_KEY);
	if (cached) {
		try {
			return JSON.parse(cached);
		} catch {
			await redis.del(CACHE_KEY);
		}
	}

	const [rows] = await pool.query('SELECT payload FROM products ORDER BY position ASC');
	const products = rows.map(row => JSON.parse(row.payload));
	await redis.set(CACHE_KEY, JSON.stringify(products), { EX: CACHE_TTL_SECONDS });
	return products;
}

function validateProducts(products) {
	if (!Array.isArray(products)) throw new HttpError(400, 'O corpo deve ser uma lista de produtos.');

	const ids = new Set();
	for (const product of products) {
		if (!product || typeof product !== 'object' || Array.isArray(product)) {
			throw new HttpError(400, 'Cada produto deve ser um objeto.');
		}
		if (typeof product.id !== 'string' || product.id.length === 0 || product.id.length > 191) {
			throw new HttpError(400, 'Cada produto deve ter um id válido de até 191 caracteres.');
		}
		if (ids.has(product.id)) throw new HttpError(400, 'A lista contém ids duplicados.');
		ids.add(product.id);
	}
}

async function replaceProducts(products) {
	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();
		await connection.query('DELETE FROM products');
		for (const [position, product] of products.entries()) {
			await connection.execute(
				'INSERT INTO products (id, position, payload) VALUES (?, ?, ?)',
				[product.id, position, JSON.stringify(product)]
			);
		}
		await connection.commit();
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}

	await redis.del(CACHE_KEY);
}

const server = http.createServer(async (request, response) => {
	const pathname = new URL(request.url, 'http://localhost').pathname;

	try {
		if (request.method === 'GET' && pathname === '/api/health') {
			await pool.query('SELECT 1');
			await redis.ping();
			return sendJson(response, 200, { status: 'ok' });
		}
		if (request.method === 'GET' && pathname === '/api/products') {
			return sendJson(response, 200, await getProducts());
		}
		if (request.method === 'PUT' && pathname === '/api/products') {
			const products = await readJson(request);
			validateProducts(products);
			await replaceProducts(products);
			return sendJson(response, 200, { saved: products.length });
		}
		return sendJson(response, 404, { error: 'Endpoint não encontrado.' });
	} catch (error) {
		const status = error instanceof HttpError ? error.status : 503;
		if (status === 503) console.error(error);
		return sendJson(response, status, { error: error.message || 'Serviço indisponível.' });
	}
});

async function start() {
	await redis.connect();
	await pool.query(`
		CREATE TABLE IF NOT EXISTS products (
			id VARCHAR(191) NOT NULL PRIMARY KEY,
			position INT NOT NULL,
			payload LONGTEXT NOT NULL,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
	`);
	server.listen(PORT, '0.0.0.0', () => console.log(`API pronta na porta ${PORT}.`));
}

start().catch(error => {
	console.error('Falha ao iniciar a API:', error);
	process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, async () => {
		server.close();
		await Promise.allSettled([pool.end(), redis.isOpen ? redis.quit() : Promise.resolve()]);
		process.exit(0);
	});
}
