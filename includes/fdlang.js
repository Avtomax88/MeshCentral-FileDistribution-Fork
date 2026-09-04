/**
* @description MeshCentral File Distribution - interface strings
* @license Apache-2.0
*
* English is the source language and the fallback: a key with no translation
* falls back to English rather than showing the key itself, so a partial
* translation degrades quietly instead of breaking the page.
*
* Loaded by both views through pluginadmin.ashx?pin=filedist&include=1.
*/

var FD_STR = {
    en: {
        // panels
        distributePanel: 'Distribute a file to many devices',
        devicesPanel: 'Devices',
        currentPanel: 'Current distributions',
        settings: 'Settings',
        expand: 'Expand',
        collapse: 'Collapse',
        expandTitle: 'Use the whole window',
        refresh: 'Refresh',

        // file and destination
        fileFromMyFiles: 'File from My Files',
        folderOnDevices: 'Folder on the devices',
        folderPlaceholder: 'C:\\Users\\Public\\Desktop',
        saveAs: 'Save as (empty keeps the original name)',
        recent: 'Recent:',
        willBeWritten: 'Will be written to (existing file with the same name is replaced):',
        noFilesFound: 'No files under My Files. Upload one on the Files tab first.',

        // device picker
        all: 'All',
        online: 'Online',
        offline: 'Offline',
        filterDevices: 'Filter devices by name',
        selectShown: 'Select shown',
        clearShown: 'Clear shown',
        clearAll: 'Clear all',
        devicesHead: 'DEVICES',
        groupsHead: 'DEVICE GROUPS',
        tagsHead: 'TAGS',
        noDeviceMatches: 'No device matches these filters.',
        selectedCount: '{0} of {1} selected',
        distribute: 'Distribute',

        // overview
        colFile: 'File',
        colPath: 'Path on device',
        colDevices: 'Devices',
        removeAll: 'Remove all',
        removeOne: 'Remove just this device',
        deviceCount: '{0} device(s)',
        andMore: '+{0} more',
        nothingYet: 'Nothing is being distributed yet.',

        // dialogs
        cancel: 'Cancel',
        ok: 'OK',
        remove: 'Remove',
        add: 'Add',
        next: 'Next',
        deleteWord: 'Delete',
        distributeTitle: 'Distribute file',
        distributeAsk: 'Send <b>{0}</b> to <b>{1}</b> device(s)?',
        distributeNote: 'Devices you cannot manage are skipped. Offline devices receive the file when they next connect.',
        removeTitle: 'Remove distribution',
        removeAsk: 'Stop distributing this file to <b>{0}</b> device(s)?',
        removeOneAsk: 'Stop distributing this file to <b>{0}</b>?',
        alsoDelete: 'Also delete the file from the device',
        alsoDeleteMany: 'Also delete the file from those devices',
        deleteNote: 'Only devices that are online right now can delete the file. A file that was replaced or edited on a device is left alone.',
        keepNote: 'Leave this unticked to keep the file where it is and only stop keeping it up to date.',

        // device tab
        serverPath: 'Server Path',
        clientPath: 'Client Path',
        deleteCol: 'Delete',
        noMapsHere: 'No files are distributed to this device yet.',
        chooseFile: 'Choose File to Distribute',
        chooseLocation: 'Choose Location on Endpoint',
        filterLabel: 'Filter:',
        keepsName: 'leave empty to keep',
        writtenTo: 'Will be written to:',
        noFilesUpload: 'No files were found under My Files. Upload a file on the Files tab first, then try again.',

        // messages
        pickFileFirst: 'Choose a file from My Files first.',
        pickFileList: 'Choose a file from the list first.',
        enterFolder: 'Enter the folder the file should go into.',
        noSlashInName: 'The file name cannot contain a slash.',
        noSlashInNameLong: 'The file name cannot contain a slash. Put folders in the field above.',
        selectDevice: 'Select at least one device.',
        badFolder: 'That folder could not be read as a path.',
        noDeviceId: 'This device could not be identified. Reload the page and try again.',
        addedTo: 'Added to {0} device(s).',
        addSkipped: '{0} skipped (already had this file, or you cannot manage them).',
        removedFrom: 'Removed from {0} device(s).',
        removeSkipped: '{0} skipped.',
        hostGone: 'This page needs the MeshCentral window it was opened from. That window was closed, or this tab was reloaded on its own.',
        hostGoneHint: 'Open it again from My Devices, or use My Server &gt; Plugins &gt; File Distribution.',

        // settings dialog
        settingsTitle: 'My Devices button',
        settingsShow: 'Show a Distribute File button on the My Devices toolbar',
        settingsNote: 'The button opens this page with the devices you ticked already selected.',
        settingsSaved: 'Saved. Reload My Devices to see the change.',
        settingsAdminOnly: 'Only a full site administrator can change this.',
        language: 'Language',
        langAuto: 'Automatic',
        save: 'Save'
    },

    ru: {
        distributePanel: 'Раздача файла на несколько устройств',
        devicesPanel: 'Устройства',
        currentPanel: 'Текущие раздачи',
        settings: 'Настройки',
        expand: 'Развернуть',
        collapse: 'Свернуть',
        expandTitle: 'Развернуть на всё окно',
        refresh: 'Обновить',

        fileFromMyFiles: 'Файл из «Мои файлы»',
        folderOnDevices: 'Папка на устройствах',
        folderPlaceholder: 'C:\\Users\\Public\\Desktop',
        saveAs: 'Сохранить как (пусто — оставить исходное имя)',
        recent: 'Недавние:',
        willBeWritten: 'Будет записан в (существующий файл с тем же именем заменяется):',
        noFilesFound: 'В «Моих файлах» ничего нет. Сначала загрузите файл на вкладке «Файлы».',

        all: 'Все',
        online: 'В сети',
        offline: 'Не в сети',
        filterDevices: 'Поиск устройства по имени',
        selectShown: 'Выбрать показанные',
        clearShown: 'Снять показанные',
        clearAll: 'Снять все',
        devicesHead: 'УСТРОЙСТВА',
        groupsHead: 'ГРУППЫ УСТРОЙСТВ',
        tagsHead: 'ТЕГИ',
        noDeviceMatches: 'Нет устройств, подходящих под фильтры.',
        selectedCount: 'выбрано {0} из {1}',
        distribute: 'Раздать',

        colFile: 'Файл',
        colPath: 'Путь на устройстве',
        colDevices: 'Устройства',
        removeAll: 'Снять со всех',
        removeOne: 'Снять только с этого устройства',
        deviceCount: 'устройств: {0}',
        andMore: 'и ещё {0}',
        nothingYet: 'Раздач пока нет.',

        cancel: 'Отмена',
        ok: 'ОК',
        remove: 'Снять',
        add: 'Добавить',
        next: 'Далее',
        deleteWord: 'Удалить',
        distributeTitle: 'Раздача файла',
        distributeAsk: 'Отправить <b>{0}</b> на устройства (<b>{1}</b>)?',
        distributeNote: 'Устройства, которыми вы не управляете, будут пропущены. Те, что не в сети, получат файл при следующем подключении.',
        removeTitle: 'Снятие раздачи',
        removeAsk: 'Прекратить раздачу этого файла на устройства (<b>{0}</b>)?',
        removeOneAsk: 'Прекратить раздачу этого файла на <b>{0}</b>?',
        alsoDelete: 'Также удалить файл с устройства',
        alsoDeleteMany: 'Также удалить файл с этих устройств',
        deleteNote: 'Удалить файл могут только устройства, которые сейчас в сети. Файл, заменённый или изменённый на устройстве, останется нетронутым.',
        keepNote: 'Без галочки файл останется на месте и просто перестанет обновляться.',

        serverPath: 'Путь на сервере',
        clientPath: 'Путь на устройстве',
        deleteCol: 'Удалить',
        noMapsHere: 'На это устройство пока ничего не раздаётся.',
        chooseFile: 'Выбор файла для раздачи',
        chooseLocation: 'Расположение на устройстве',
        filterLabel: 'Фильтр:',
        keepsName: 'пусто — оставить',
        writtenTo: 'Будет записан в:',
        noFilesUpload: 'В «Моих файлах» ничего не найдено. Сначала загрузите файл на вкладке «Файлы».',

        pickFileFirst: 'Сначала выберите файл из «Моих файлов».',
        pickFileList: 'Сначала выберите файл из списка.',
        enterFolder: 'Укажите папку, в которую положить файл.',
        noSlashInName: 'Имя файла не может содержать слэш.',
        noSlashInNameLong: 'Имя файла не может содержать слэш. Папку укажите в поле выше.',
        selectDevice: 'Выберите хотя бы одно устройство.',
        badFolder: 'Не удалось разобрать указанную папку как путь.',
        noDeviceId: 'Не удалось определить устройство. Обновите страницу и попробуйте снова.',
        addedTo: 'Добавлено на устройства: {0}.',
        addSkipped: 'Пропущено: {0} (файл уже раздаётся туда либо нет прав на управление).',
        removedFrom: 'Снято с устройств: {0}.',
        removeSkipped: 'Пропущено: {0}.',
        hostGone: 'Этой странице нужно окно MeshCentral, из которого она открыта. Оно закрыто, либо вкладка была перезагружена сама по себе.',
        hostGoneHint: 'Откройте её заново из «Мои устройства» либо через «Мой сервер → Плагины → File Distribution».',

        settingsTitle: 'Кнопка на «Мои устройства»',
        settingsShow: 'Показывать кнопку раздачи файла на панели «Мои устройства»',
        settingsNote: 'Кнопка открывает эту страницу с уже отмеченными устройствами.',
        settingsSaved: 'Сохранено. Обновите «Мои устройства», чтобы увидеть изменение.',
        settingsAdminOnly: 'Менять эту настройку может только полный администратор сервера.',
        language: 'Язык',
        langAuto: 'Автоматически',
        save: 'Сохранить'
    }
};

// Chosen language: an explicit override wins, then the host page's language,
// then the browser's. Anything unknown falls back to English.
function fdPickLang(hostLang) {
    var pick = null;
    try { pick = localStorage.getItem('fd_lang'); } catch (e) { }
    if ((pick != null) && (pick != 'auto') && (FD_STR[pick] != null)) return pick;
    var cand = [];
    if (hostLang) cand.push(String(hostLang));
    try { if (navigator.language) cand.push(String(navigator.language)); } catch (e) { }
    for (var i = 0; i < cand.length; i++) {
        var two = cand[i].substring(0, 2).toLowerCase();
        if (FD_STR[two] != null) return two;
    }
    return 'en';
}

// T('key') or T('key', a, b) for the {0}/{1} placeholders.
function fdMakeT(lang) {
    return function (key) {
        var d = FD_STR[lang] || FD_STR.en;
        var s = d[key];
        if (s == null) s = FD_STR.en[key];
        if (s == null) return key;
        for (var i = 1; i < arguments.length; i++) {
            s = s.split('{' + (i - 1) + '}').join(String(arguments[i]));
        }
        return s;
    };
}
