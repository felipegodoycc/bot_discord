import { Song } from "./song";

export interface TokenAccessResponse {
    access_token: string,
    token_type: string,
    expires_in: number
}
  
export interface SpotifyTrack extends Song {
    loaded: boolean;
    trackId: string;
}