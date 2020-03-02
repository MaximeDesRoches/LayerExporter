figma.showUI(__html__);
function getArtwork(format = 'PNG', resolution = "2") {
    return new Promise(resolve => {
        // let selected = figma.currentPage.selection[0];
        const { selection } = figma.currentPage;
        if (selection.length === 0)
            return;
        try {
            Promise.all(selection.map((selected) => {
                return selected.exportAsync({ format, constraint: { type: 'SCALE', value: parseInt(resolution, 10) } })
                    .then(data => {
                    return {
                        selected,
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
        const { format, resolution } = data;
        console.log(data);
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
                    rect: {
                        x,
                        y,
                        width: frame.width * resolution,
                        height: frame.height * resolution
                    },
                };
            });
            figma.ui.postMessage({
                images: messages,
            });
        });
    }
};
