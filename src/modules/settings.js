const settings = require('electron-settings');

if (!settings.has('language')) {
    settings.set('language', 'en');
}

if (!settings.has('theme')) {
    settings.set('theme', 'default');
} else {
    settings.set('theme', settings.get('theme').toLowerCase());
}

if (!settings.has('mostPopularHeroes')) {
    settings.set('mostPopularHeroes', '30');
}

if (!settings.has('totals')) {
    settings.set('totals', '20');
}

if (!settings.has('playersInLastLobby')) {
    settings.set('playersInLastLobby', new Array(10));
}