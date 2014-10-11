chrome.devtools.panels.create(
    'Conkitty Route',
    null, // No icon path
    'Panel/ConkittyRoutePanel.html',
    function(panel) {
        panel.onShown.addListener(function(panelWindow) {
            panelWindow.conkittyPanelShown.call(panelWindow);
        });
    }
);
