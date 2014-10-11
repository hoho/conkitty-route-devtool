window.conkittyPanelShown = (function() {
    //alert(chrome.devtools.inspectedWindow);

    return conkittyPanelShown;

    function conkittyPanelShown() {
        document.body.innerHTML = Math.random();
    }
})();
