export const DEFAULT_PREFIX = '!'
export const DEFAULT_LISTENCHANNEL = 'test-bot'
export const DEFAULT_GENERALCHANNEL = 'general'
export const DEFAULT_PLAYLIST_LIMIT = 15;
export const DEFAULT_DEDICATED_MUSIC_TEXT_CHANNEL = 'music-bot-dedicated'
export const MESSAGES = {
    INVALID_COMMAND: 'Debes ingresar un comando valido :( !',
    MOVE_SUCCESS: 'Listo, movido',
    NOT_FOUND_MEMBER: 'Usuario no encontrado :(',
    NOT_FOUND_CHANNEL: 'No pude encontrar el canal :(',
    NOT_VOICE_CHANNEL: 'El canal de destino no es de voz :(',
    NOT_VOICE_PERMISSION: 'No tengo permisos para reproducir musica :(',
    MEMBER_NOT_IN_VOICE_CHANNEL: 'Debes estar en un canal de voz para modificar la musica',
    MOVE_REASON: 'Me lo pidio {0}',
    ADD_SONG: '{0} ha sido añadida a la cola',
    EMPTY_QUEUE: 'No hay mas canciones en la cola, no hay nada que saltar',
    PLAY_SONG: 'Reproduciendo: {0} jijiji',
    NOT_RESPONSE: 'No tengo respuesta para eso, pete',
    ERROR: 'Changos, algo salio mal :(',
    NOT_USER_FIND: 'no pude encontrar al loquito',
    NOT_INTENT_EXIST: 'No cacho de esa wea',
    NOT_QUEUE_EXIST: 'Quien esta fumando webon? no hay lista webon',
    WELCOME_VOICE_CHAT: '{0} se ha conectado a {1}, ta solito, quiere pito.',
    OUT_OF_QUEUE_RANGE: 'Wou wou wou esta cancion no esta en la lista',
    NOT_ALLOWED_ORIGIN: 'Link mas enviado u origen no soportado',
    WELCOME_DEDICATED_MUSIC_CHANNEL: 'Bienvenido al canal dedicado de musica, solo debes enviar la cancion o link, sin ningun comando',
    DEDICATED_CHANNEL_EXIST: 'El canal dedicado ya existe',
    DEDICATE_CHANNEL_SUCCESFULL: 'listo, busca el canal de texto {0} y reproduce musica directamente sin comandos',
    NOT_COMMAND_HERE: "Aqui no van comandos webon, usa el canal del bot",
    NOT_CONFIG: "No es una configuracion valida",
    COMMAND_SAVE: "El comando {0} ha sido configurado con el siguiente valor \"{1}\". La configuracion actual es:"
}
export const SETTINGS_DESC = {
    prefix: "Permite configurar el prefijo para el bot",
    lschannel: "Permite configurar el canal de texto que escuchara el bot",
    plimit: "Limite de carga de canciones para playlists",
    dmtchannel: "Permite configurar el canal de texto para enviar canciones sin comandos",
}