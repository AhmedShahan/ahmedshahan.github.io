function openResource(resourcePath) {
    // For PDFs
    if (resourcePath.toLowerCase().endsWith('.pdf')) {
        const viewer = window.open('', '_blank');
        viewer.document.write(`
            <html>
                <body style="margin:0;padding:0;overflow:hidden">
                    <iframe src="${resourcePath}" style="width:100%;height:100vh;border:none;"></iframe>
                </body>
            </html>
        `);
    } 
    // For PPT/PPTX
    else if (resourcePath.toLowerCase().match(/\.ppt(x)?$/)) {
        // Using Microsoft's Office Online viewer
        const onlineViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + resourcePath)}`;
        window.open(onlineViewerUrl, '_blank');
    }
}