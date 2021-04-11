import { RedisService } from "./redis";
import { SettingsService } from "./settings";
import { SpotifyService } from "./spotify";

const redisService = new RedisService();
const settingsService = new SettingsService(redisService);
const spotifyService = new SpotifyService();

export default {
    redisService,
    settingsService,
    spotifyService
}