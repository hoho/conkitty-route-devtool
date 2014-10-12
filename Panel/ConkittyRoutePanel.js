(function() {
    var updatePanelTimer;
    var currentFrames;

    window.conkittyRoutePanelUpdate = conkittyRoutePanelUpdate;
    window.conkittyRoutePanelUpdatePause = conkittyRoutePanelUpdatePause;

    function conkittyRoutePanelUpdate() {
        if (updatePanelTimer) { clearTimeout(updatePanelTimer); }

        chrome.devtools.inspectedWindow.eval('(' + __serializeRouter.toString() + ')()', function(frames) {
            if (frames !== undefined) {
                if (frames) {
                    if (!currentFrames || !currentFrames.equalStructure || !currentFrames.equalStructure(frames)) {
                        // Draw new tree.
                        drawTree(frames);
                    } else {
                        // Update current tree.
                        currentFrames.update(frames);
                    }
                } else {
                    if (currentFrames !== true) {
                        currentFrames = true;
                        drawNoRoute('Conkitty Route is not running');
                    }
                }
            } else {
                if (currentFrames !== false) {
                    currentFrames = false;
                    drawNoRoute();
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


    function drawNoRoute(message) {
        document.body.innerHTML = '<div class="b-no-routes"><div>' + (message || 'No Conkitty Routes') + '</div></div>';
    }


    function checkTreeChanges(frames, target) {
        // XXX: Pretty dumb comparator for the moment. Probably optimize and
        //      improve it some day.
        return JSON.stringify(frames) !== JSON.stringify(target);
    }


    function drawTree(frames) {
        currentFrames = new Frames(frames);

        if (!frames.length) {
            drawNoRoute('Conkitty Route has empty routing table');
            return;
        }

        document.body.innerHTML = '';
        document.body.appendChild(currentFrames.node);
    }


    function Frames(frames) {
        var children = this.children = [],
            child,
            node;

        this.node = node = document.createElement('div');
        node.className = 'b-frames';

        for (var i = 0; i < frames.length; i++) {
            child = new Frame(frames[i], 18);
            children.push(child);
            node.appendChild(child.node);
        }
    }


    Frames.prototype.equalStructure = function(frames) {
        var children = this.children;

        if (children.length !== frames.length) { return false; }

        for (var i = 0; i < children.length; i++) {
            if (!children[i].equalStructure(frames[i])) { return false; }
        }

        return true;
    };


    Frames.prototype.update = function(frames) {
        var children = this.children;

        for (var i = 0; i < frames.length; i++) {
            children[i].update(frames[i]);
        }
    };


    function Frame(frame, marginLeft) {
        var props = this.props = {},
            children = this.children = [],
            c,
            child,
            node,
            contents,
            tmp;

        for (var key in frame) {
            if (key !== 'children') {
                props[key] = frame[key];
            }
        }

        this.node = node = document.createElement('div');
        node.className = this.getClass();

        contents = document.createElement('div');
        contents.className = 'b-frame__contents';
        contents.style.marginLeft = marginLeft + 'px';

        tmp = document.createElement('div');
        tmp.className = 'b-frame__status';
        tmp.innerHTML = '<div class="b-frame__loading">⚙</div><div class="b-frame__ok">✓</div><div class="b-frame__error">✗</div><div class="b-frame__inactive">◦</div>';
        contents.appendChild(tmp);

        this.uri = tmp = document.createElement('div');
        tmp.className = 'b-frame__uri';
        tmp.textContent = props.uri === null ? 'not found' : (props.uri || '/');
        contents.appendChild(tmp);

        node.appendChild(contents);

        c = frame.children;
        for (var i = 0; i < c.length; i++) {
            child = new Frame(c[i], marginLeft + 20);
            children.push(child);
            node.appendChild(child.node);
        }
    }


    Frame.prototype.getClass = function() {
        var props = this.props;
        var className = ['b-frame'];

        if (props.active) {
            className.push('b-frame_active');
            switch (props.status) {
                case 'loading':
                    className.push('b-frame_loading');
                    break;
                case 'ok':
                    className.push('b-frame_ok');
                    break;
                case 'error':
                    className.push('b-frame_error');
                    break;
            }
        } else {
            className.push('b-frame_inactive');
        }
        if (props.uri === null) { className.push('b-frame_not-found'); }

        return className.join(' ');
    };


    Frame.prototype.equalStructure = function(frame) {
        var children = this.children,
            frames = frame.children;

        if (children.length !== frames.length) { return false; }

        for (var i = 0; i < children.length; i++) {
            if (!children[i].equalStructure(frames[i])) { return false; }
        }

        return true;
    };


    Frame.prototype.update = function(frame) {
        var children = this.children,
            frames = frame.children,
            props = this.props,
            updateClass;

        if (props.uri !== frame.uri) {
            props.uri = frame.uri;
            uri.textContent = props.uri === null ? 'not found' : (props.uri || '/');
            updateClass = true;
        }

        if (props.active !== frame.active) {
            props.active = frame.active;
            updateClass = true;
        }

        if (props.status !== frame.status) {
            props.status = frame.status;
            updateClass = true;
        }

        if (updateClass) {
            this.node.className = this.getClass();
        }

        for (var i = 0; i < children.length; i++) {
            children[i].update(frames[i]);
        }
    };


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
