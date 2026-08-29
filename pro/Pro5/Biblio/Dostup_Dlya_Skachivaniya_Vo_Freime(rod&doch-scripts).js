
<script>
//Скачивание во фрейме 
Дочерний скрипт Внутри игры при скачивании
function downloadImage(dataUrl, filename) {
    if (window.parent && window.parent !== window) {
        // Отправляем родителю для скачивания
        window.parent.postMessage({
            type: 'download',
            content: dataUrl, // или сам файл
            filename: filename || 'picture.png',
            mimeType: 'image/png'
        }, '*');
    } else {
        // Обычное скачивание если не в iframe
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename || 'picture.png';
        a.click();
    }
}
</script>



 
<script>
// Родительский скрипт Слушаем сообщения от дочерних 
iframe
window.addEventListener('message', function(event) {
    // Проверяем, что сообщение от нашего iframe
    const iframe = document.querySelector('.transition-iframe');
    if (event.source !== iframe?.contentWindow) return;
    
    const data = event.data;
    
    if (data && data.type === 'download') {
        handleDownload(data.content, data.filename, data.mimeType);
    }
});

// Обработка скачивания
function handleDownload(content, filename, mimeType) {
    try {
        // Если content - это URL (для скачивания по ссылке)
        if (typeof content === 'string' && content.startsWith('http')) {
            const a = document.createElement('a');
            a.href = content;
            a.download = filename || 'download';
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }

        // Если content - это данные для Blob
        let blob;
        if (typeof content === 'string') {
            blob = new Blob([content], { 
                type: mimeType || 'text/plain;charset=utf-8' 
            });
        } else if (content instanceof Blob) {
            blob = content;
        } else {
            throw new Error('Неподдерживаемый формат данных');
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 5000);

        showNotification('✅ Файл "' + (filename || 'download') + '" сохранён!', 'success');
    } catch (error) {
        console.error('Ошибка скачивания:', error);
        showNotification('❌ Ошибка скачивания: ' + error.message, 'error');
    }
}
</script>