import axios from "axios";
import { SpotifyTrack, TokenAccessResponse } from "../types/spotify";

export class SpotifyService {
    private token: string;
    private clientId: string;
    private clientSecret: string;
    private expiration:number;

    constructor(){
        this.clientId = process.env.SPOTIFY_CLIENT_ID;
        this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        this.getToken();
        console.log("SpotifyService esta listo!")
    }

    public async getPlaylist(playlistId: string): Promise<{ name: string, tracks: SpotifyTrack[] }> {
        try {
          await this.checkAndUpdateToken();
          const res = await this.getUrl(`https://api.spotify.com/v1/playlists/${playlistId}`);
          const data = res.data;
          const name = data.name;
          const defaultArt = data.images.length ? data.images[0].url : 'http://beatmakerleague.com/images/No_Album_Art.png';
          const items = data.tracks.items.concat(await this.getPlaylistTracks(data.tracks.next));
          return {
            name: name,
            tracks: items.map(item => ({
              title: item.track.name,
              url: '',
              poster: item.track.artists.map(x => x.name).join(', '),
              pic: item.track.album.images.length ? item.track.album.images[0].url : defaultArt,
              src: 'spot',
              loaded: false,
              trackId: item.track.uri
            }))
          };
        } catch (e) {
          console.log(e);
          return null;
        }
    }

    private async getPlaylistTracks(url: string): Promise<any> {
        let items = [];
    
        while (url) {
          await this.checkAndUpdateToken();
          const res = await this.getUrl(url);
          let data = JSON.parse(res.data.body);
          items = items.concat(data.items);
          url = data.next;
        }
    
        return items;
    }

    private async getToken(): Promise<void> {
        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")
        console.log("AUTH SPOTIFY: ", auth)
        const payload = "grant_type=client_credentials"
        try {
            const resp = await axios.post<TokenAccessResponse>('https://accounts.spotify.com/api/token', payload, { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }});
            this.token = resp.data.access_token;
            this.expiration = Date.now() + resp.data.expires_in;
            console.log("TOKEN: ", this.token)
        } catch (error) {
            console.log("ERROR SP: ", error)
        } 
    }

    private async checkAndUpdateToken() {
        if (Date.now() + 5000 > this.expiration) {
          await this.getToken();
        }
    }

    private getUrl(url: string){
        return axios.get(url, { headers: { 'Authorization': `Bearer ${this.token}` }});
    }


}