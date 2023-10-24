const { ipcRenderer } = require('electron');

function closeCancelDialog() {
   ipcRenderer.send('confirm-dialog_respond', 'cancel');
}

function closeConfirmDialog() {
   ipcRenderer.send('confirm-dialog_respond', 'confirm');
}

document.addEventListener('keydown', ev => {
   if(ev.key == 'Escape') closeCancelDialog();
   else if(ev.key == 'Enter') closeConfirmDialog();
});


document.getElementById("btn-cancel").addEventListener("click", closeCancelDialog);

document.getElementById("btn-confirm").addEventListener("click", closeConfirmDialog);

ipcRenderer.on('confirm-dialog_setText', (eEvent, title, desc) => {
   document.getElementById('title').innerHTML = title;
   document.getElementById('desc').innerHTML = desc;
});
