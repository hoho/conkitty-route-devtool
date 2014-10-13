(function() {
    'use strict';

    var panelWindow;

    /* global chrome */
    chrome.devtools.panels.create(
        'Conkitty Route',
        null, // No icon path
        'conkitty-panel.html',
        function(panel) {
            panel.onShown.addListener(function(pw) {
                panelWindow = pw;
                panelWindow.conkittyRoutePanelUpdate.call(panelWindow);
            });
            panel.onHidden.addListener(function() {
                if (panelWindow && panelWindow.conkittyRoutePanelUpdatePause) {
                    panelWindow.conkittyRoutePanelUpdatePause.call(panelWindow);
                }
            });
        }
    );
})();
