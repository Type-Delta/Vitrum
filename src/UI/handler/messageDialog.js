const { ipcRenderer } = require('electron');


function closeDialog() {
   ipcRenderer.send('message-dialog_closed');
}


document.addEventListener('keydown', ev => {
   if(ev.key == 'Escape') closeDialog();
});


document.getElementById("btn-confirm").addEventListener("click", closeDialog);




ipcRenderer.on('message-dialog_setText', (eEvent, title, desc) => {
   document.getElementById('title').innerHTML = title;
   document.getElementById('desc').innerHTML = desc;
});
