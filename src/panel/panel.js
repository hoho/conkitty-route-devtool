/* global $C */
/* global chrome */
/* global $CR */
(function() {
    'use strict';

    var updatePanelTimer;
    var currentFrames;
    var currentFrameId;
    var newFrameId;

    $C.define('template', function(item, index, arr, args) {
        $C.tpl[args[0]].apply(this, Array.prototype.slice.call(args, 1));
    });

    window.conkittyRoutePanelUpdate = conkittyRoutePanelUpdate;
    window.conkittyRoutePanelUpdatePause = conkittyRoutePanelUpdatePause;

    document.addEventListener('click', function(e) {
        var node = e.target,
            id;

        while (node && !((id = node.getAttribute('frame-id')))) { node = node.parentNode; }
        if (id) {
            newFrameId = id;
            conkittyRoutePanelUpdate();
        }
    }, false);


    function conkittyRoutePanelUpdate() {
        if (updatePanelTimer) { clearTimeout(updatePanelTimer); }

        chrome.devtools.inspectedWindow.eval('(' + __serializeRouter.toString() + ')()', function(frames) {
            if (frames !== undefined) {
                if (frames) {
                    var framesStringified = JSON.stringify(frames);
                    if ((currentFrames !== framesStringified) || (currentFrameId !== newFrameId)) {
                        currentFrames = framesStringified;
                        currentFrameId = newFrameId;
                        $C(document.body, true).template('panel', frames, currentFrameId).end();
                    }
                } else {
                    if (currentFrames !== true) {
                        currentFrames = true;
                        $C(document.body, true).template('nothing', 'Conkitty Route is not running').end();
                    }
                }
            } else {
                if (currentFrames !== false) {
                    currentFrames = false;
                    $C(document.body, true).template('nothing').end();
                }
            }

            updatePanelTimer = setTimeout(function() {
                updatePanelTimer = null;
                conkittyRoutePanelUpdate();
            }, 300);
        });
    }


    function conkittyRoutePanelUpdatePause() {
        if (updatePanelTimer) {
            clearTimeout(updatePanelTimer);
            updatePanelTimer = null;
        }
    }


    function __serializeRouter() {
        // This function will run in the context of the inspectedWindow and
        // should return JSON serializable structure.
        if (window.$CR) {
            if ($CR._debug) {
                var ret = [];

                serializeFrames($CR._debug.f, ret);

                return ret;
            } else {
                return null;
            }
        }

        function serializeFrames(frames, ret) {
            var i,
                frame,
                f,
                status;

            for (i = 0; i < frames.length; i++) {
                frame = frames[i];

                if (frame._dataError) {
                    status = 'error';
                } else if (frame._data && (typeof frame._data.reject === 'function')) {
                    status = 'loading';
                } else if (frame._data !== undefined) {
                    status = 'ok';
                } else {
                    status = null;
                }

                f = {
                    _id: frame._id,
                    id: frame.id,
                    uri: frame.uri,
                    title: frame.title,
                    active: frame.active() ? (frame.active(true) ? 2 : 1) : 0,
                    params: frame.params(),
                    data: frame.data(),
                    break: frame.break,
                    keep: frame.keep,
                    wait: frame.wait,
                    final: frame.final,
                    status: status,
                    children: []
                };
                ret.push(f);

                serializeFrames(frame.children, f.children);
            }
        }
    }
})();
