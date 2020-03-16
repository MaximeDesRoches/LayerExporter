figma.showUI(__html__, { width: 300, height: 300 });
function getArtwork(format = 'PNG', resolution = "2") {
    return new Promise(resolve => {
        // let selected = figma.currentPage.selection[0];
        const { selection } = figma.currentPage;
        if (selection.length === 0)
            return;
        try {
            Promise.all(selection.map((selected) => {
                let node = selected;
                if (node.type === 'TEXT') {
                    const cloned = node.clone();
                    const parent = node.parent;
                    parent.appendChild(cloned);
                    node = figma.flatten([cloned]);
                    // cloned.remove();
                }
                return node.exportAsync({ format, constraint: { type: 'SCALE', value: parseInt(resolution, 10) } })
                    .then(data => {
                    return {
                        selected: node,
                        data
                    };
                });
            })).then(data => resolve(data));
        }
        catch (err) {
            return err;
        }
    });
}
function getFrame(node) {
    let last = node;
    while (node.parent && node.type != 'PAGE') {
        last = node;
        node = node.parent;
    }
    return last;
}
function getPosition(node, frame, resolution = 2, x = 0, y = 0) {
    if (node === frame)
        return { x: x, y };
    return getPosition(node.parent, frame, resolution, x + node.x, y + node.y);
}
figma.ui.onmessage = (message) => {
    const { action, data } = JSON.parse(message);
    if (action === 'export') {
        const { format, resolution, quality, } = data;
        getArtwork(format, resolution).then(images => {
            const messages = images.map(image => {
                const selected = image.selected;
                const frame = getFrame(selected);
                let { x, y } = getPosition(selected, frame, parseInt(resolution, 10));
                x *= resolution;
                y *= resolution;
                return {
                    data: image.data,
                    name: selected.name,
                    format,
                    resolution,
                    quality,
                    rect: {
                        x,
                        y,
                        width: frame.width * resolution,
                        height: frame.height * resolution
                    },
                };
            });
            console.log(messages);
            figma.ui.postMessage({
                images: messages,
            });
        });
    }
};
