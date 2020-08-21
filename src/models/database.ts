import { promisify } from "util";
import { createConnection, format, Connection } from "mysql";

interface Row {
	discordId: number,
	accountId: number,
	accountName: string
}

const configuration = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_USER
}

export class DataBase {
	public connection: Connection;
	//  readonly connect: any;
	public query: any;
	// public readonly end: any;

	constructor() {
		this.createConnection();
		// this.connect = promisify(this.connection.connect).bind(this.connection);
		// this.end = promisify(this.connection.end).bind(this.connection);
	}

	private createConnection() {
		this.connection = createConnection(configuration);
		this.query = promisify(this.connection.query).bind(this.connection);

		this.connection.connect( err => {
			if(err) {
				console.log('error when connecting to db:', err);
				setTimeout(() => this.createConnection(), 2000);
			}
		});

		this.connection.on(`error`, (err) => {
			console.log('db error', err);
			if(err.code === 'PROTOCOL_CONNECTION_LOST') {
				this.createConnection();
				console.log(`created a new connection`);
			} else {
				throw err;
			}
		});
	}

	public async getDataByAccountId(accountId: number | string): Promise<Row[]> {
		try {
			// await this.connect();
			const sql = format('SELECT `discordId`, `accountId`,`accountName` FROM `users` WHERE `accountId`=?', [accountId]);
			const data: Row[] = await this.query(sql);
			return data;
		} catch(err) {
			throw new Error(`Failed at SELECT - ACCOUNT_ID: ${err}`);
		} finally {
			// await this.end();
		}
	}

	public async getDataByAuthorId(authorId: number | string): Promise<Row[]> {
		try {
			// await this.connect();
			const sql = format('SELECT `discordId`, `accountId`,`accountName` FROM `users` WHERE `discordId`=?', [authorId]);
			const data: Row[] = await this.query(sql);
			return data
		} catch(err) {
			throw new Error(`Failed at SELECT - AUTHOR_ID: ${err}`);
		} finally {
			// await this.end();
		}
	}

	public async setData(authorId: number | string, accountId: number | string, accountName: string): Promise<Row[]> {
		try {
			// await this.connect();
			const sql = format('INSERT INTO `users`(`discordId`, `accountId`, `accountName`) VALUES (?, ?, ?)', [authorId, accountId, accountName]);
			const data: Row[] = await this.query(sql);
			return data
		} catch(err) {
			throw new Error(`Failed at INSERT: ${err}`);
		} finally {
			// await this.end();
		}
	}

}

export default new DataBase();