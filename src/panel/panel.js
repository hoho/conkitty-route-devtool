/* global $C */
/* global chrome */
/* global $CR */
(function() {
    'use strict';

    var updatePanelTimer;
    var currentFrames;
    var currentFrameId;
    var currentDetails;
    var newFrameId;
    var lastExpose;
    var framesNode;
    var detailsNode;

    $C.define('template', function(item, index, arr, args) {
        lastExpose = $C.tpl[args[0]].apply(this, Array.prototype.slice.call(args, 1));
    });

    window.conkittyRoutePanelUpdate = conkittyRoutePanelUpdate;
    window.conkittyRoutePanelUpdatePause = conkittyRoutePanelUpdatePause;

    document.addEventListener('click', function(e) {
        var node = e.target,
            id = null,
            index = null;

        while (node &&
               (((id = node.getAttribute('frame-id')) === null)) &&
               (((index = node.getAttribute('tag-index'))) === null))
        {
            node = node.parentNode;
        }

        if (id !== null) {
            newFrameId = id;
            conkittyRoutePanelUpdate();
        }

        if (index !== null) {
            chrome.devtools.inspectedWindow.eval('(' + __inspectElement.toString() + ')(' + index + ', ' + (JSON.stringify(newFrameId)) + ')');
        }
    }, false);


    function conkittyRoutePanelUpdate() {
        if (updatePanelTimer) { clearTimeout(updatePanelTimer); }

        chrome.devtools.inspectedWindow.eval('(' + __serializeRouter.toString() + ')(' + (JSON.stringify(newFrameId)) + ')', function(frames) {
            if (frames !== undefined) {
                if (frames) {
                    if (!currentFrames || currentFrames === true) {
                        $C(document.body, true).template('panel').end();
                        framesNode = lastExpose.frames;
                        detailsNode = lastExpose.details;
                    }

                    if ((currentFrames !== frames) || (currentFrameId !== newFrameId)) {
                        currentFrames = frames;
                        currentFrameId = newFrameId;

                        $C(framesNode, true).template('frames', JSON.parse(frames), currentFrameId).end();

                        var tmpJSON = JSON.stringify(lastExpose || null);
                        if (tmpJSON !== currentDetails) {
                            currentDetails = tmpJSON;
                            $C(detailsNode, true).template('details', lastExpose).end();
                        }
                    }
                } else {
                    if (currentFrames !== true) {
                        currentFrames = true;
                        currentFrameId = newFrameId = undefined;
                        tmpJSON = null;
                        $C(document.body, true).template('nothing', 'Conkitty Route is not running').end();
                    }
                }
            } else {
                if (currentFrames !== false) {
                    currentFrames = false;
                    currentFrameId = newFrameId = undefined;
                    tmpJSON = null;
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


    function __serializeRouter(currentFrameId) {
        // This function will run in the context of the inspectedWindow and
        // should return JSON serializable structure.
        if (window.$CR) {
            if ($CR._debug) {
                var ret = [];
                serializeFrames($CR._debug.f, ret);
                return JSON.stringify(ret);
            } else {
                return JSON.stringify(null);
            }
        }

        function serializeFrames(frames, ret) {
            var i,
                frame,
                f,
                status;

            for (i = 0; i < frames.length; i++) {
                frame = frames[i];

                if (frame._data && (typeof frame._data.reject === 'function')) {
                    status = 'loading';
                } else if (frame._dataError) {
                    status = 'error';
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
                    break: frame.break,
                    keep: frame.keep,
                    wait: frame.wait,
                    final: frame.final,
                    status: status,
                    error: frame._dataError,
                    children: []
                };

                if (currentFrameId === frame._id) {
                    f.params = frame.params();
                    f.data = frame.data(-1);
                    f.dataSource = frame.dataSource.map(dataSourceType);

                    var n = frame._n,
                        elems = f.elems = [],
                        j,
                        k,
                        nodes,
                        e,
                        index = 0;

                    for (j in n) {
                        nodes = n[j];
                        if (nodes.length > 1) {
                            e = [];
                            for (k = 1; k < nodes.length; k++) {
                                e.push(serializeNode(nodes[k], index++));
                            }
                            elems.push({parent: serializeNode(nodes[0].parentNode, index++), elems: e});
                        }
                    }
                }

                ret.push(f);

                serializeFrames(frame.children, f.children);
            }
        }


        function dataSourceType(item) {
            var type = item && (typeof item.then === 'function') ?
                'Promise'
                :
                (typeof item === 'function' ?
                    'Function'
                    :
                    (typeof item === 'string' ? 'uri' : 'Object'));

            return type === 'uri' ? {type: type, value: item + ''} : {type: type};
        }


        function serializeNode(node, index) {
            switch (node && node.nodeType) {
                case 1: // Element.
                    var attrs,
                        attrsObj,
                        nodeObj = {tag: node.tagName.toLowerCase()},
                        i,
                        a;

                    attrs = node.attributes;

                    if (attrs.length) {
                        attrsObj = {};
                        for (i = 0; i < attrs.length; i++) {
                            a = attrs[i];
                            attrsObj[a.name] = a.value;
                        }
                        nodeObj.attr = attrsObj;
                    }

                    nodeObj.index = index;
                    return nodeObj;

                case 3: // Text.
                    return {text: node.textContent, index: index};
            }
        }
    }


    function __inspectElement(index, frameId) {
        // This function will run in the context of the inspectedWindow and
        // should return JSON serializable structure.
        var node = findElement(findFrame($CR._debug.f));

        if (node) {
            /* global inspect */
            inspect(node);
        }

        function findFrame(children) {
            if (!children) { return; }

            var i,
                ret,
                frame;

            for (i = 0; i < children.length; i++) {
                frame = children[i];
                if (frame._id === frameId) {
                    ret = frame;
                } else {
                    ret = findFrame(frame.children);
                }

                if (ret) {
                    break;
                }
            }

            return ret;
        }

        function findElement(frame) {
            // An obscure way to find an element.
            /* eslint consistent-return: 0 */
            if (!frame) { return; }

            var n = frame._n,
                i,
                j,
                nodes,
                idx = 0;

            for (i in n) {
                nodes = n[i];
                if (nodes.length > 1) {
                    for (j = 1; j < nodes.length; j++) {
                        if (idx++ === index) {
                            return nodes[j];
                        }
                    }
                    if (idx++ === index) {
                        return nodes[0].parentNode;
                    }
                }
            }
        }
    }
})();
