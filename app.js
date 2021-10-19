const {Client, MessageMedia} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const exceljs = require('exceljs');
const moment = require('moment');

const SESSION_FILE = './session.json';
let client;
let sessionData;

const withSession = () => {
    sessionData = require(SESSION_FILE);   
    client = new Client({
        session: sessionData,
    });

    client.on('ready', () => {
        console.log('Ready');       
        listenMessage(); 
    });
}

const withOutSession = () => {
    client = new Client({});
    client.on('qr', (qr) => {
        qrcode.generate(qr, {small: true});
    });

    client.on('authenticated', (session) => {
        sessionData = session.get('data');
        fs.writeFile(SESSION_FILE, JSON.stringify(session), (err) => {
            if(err) console.log(err);
        });
    });

    client.initialize();
}

const sendMedia = (to, file) => {
    const mediaFile = MessageMedia.fromFilePath(`./mediaSend/${file}`);
}

const listenMessage = () => {
    client.on('message', (msg) => {
        const {from, to, body} = msg;
        console.log({from, to, body});
    });
}

const sendMessage = (to, message) => {
    client.sendMessage(to, message);
}

const saveHistorial = (number, message) => {
    const pathChat = `./chats/${number}.xlsx`;
    const workbook = new exceljs.Workbook(pathChat);
    const today = moment().format('DD-MM-YYYY hh:mm');
    
    if(fs.existsSync(pathChat)) {
        workbook.xlsx.readFile(pathChat)
        .then(()=>{
            const worksheet = workbook.xlsx.getWorksheet(1);
            const lastRow = worksheet.lastRow;
            let getRowInsert = worksheet.getRow(++(lastRow.number));
            getRowInsert.getCell('A').value = today;
            getRowInsert.getCell('B').value = message;
            getRowInsert.commit();
            workbook.xlsx.writeFile(pathChat)
            .then(()=> {})
            .catch(()=> {});
        });
    } else {
        const worksheet = workbook.addWorksheet('chats');
        worksheet.columns = [
            {header:'Fecha', key: 'date'},
            {header:'Mensaje', key: 'message'}
        ];
        worksheet.addRow([today, message]);
        workbook.xlsx.writeFile(pathChat)
        .then(() => {
            console.log('Historial Creado');
        })
        .catch(() => {
            console.log('Algo fallo');
        });
    }
} 

(fs.existsSync(SESSION_FILE)) ? withSession() : withOutSession();