import { RedisClient } from "redis";

export class RedisService {
    private redisClient: RedisClient;

    constructor(){
        this.redisClient = new RedisClient({
            host: 'localhost',
            port: 6379
        })
        this.redisClient.on("ready", () => console.log("Redis conectado"));
        this.redisClient.on("error", (error) => console.error(error));
    }

    set(key: string, data: string): Promise<string>{
        return new Promise( (resolve, reject) => {
            this.redisClient.set(key, data, (err,cb) => {
                if(err) return reject(err)
                return resolve(cb)
            })
        }) 
            
    }

    get(key: string): Promise<string> {
        return new Promise( (resolve, reject) => {
            this.redisClient.get(key, (err, cb) => {
                if(err) return reject(err)
                return resolve(cb)
            })
        }) 
    }

    async setObject(key: string, obj: Object) {
        const objString = JSON.stringify(obj);
        return await this.set(key, objString)
    }

    async getObject<T>(key: string): Promise<T> {
        const objString = await this.get(key);
        return JSON.parse(objString)
    }

}