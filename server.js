var express = require('express');
var app = express();
var mssqlPool = require('./js/config.js');
var mssql = require('mssql');
var cookieParser = require('cookie-parser');
var path = require('path');
var bodyParser = require('body-parser');

var port = 8080;

// подключение модулей для обработки запросов
var displayHandler = require('./js/displayhandler');
var insertHandler = require('./js/inserthandler');
var editHandler = require('./js/edithandler');

// установка генератора шаблонов
app.set('views', __dirname + '/pages');
app.set('view engine', 'ejs');

// Настройка cookie-parser
app.use(cookieParser());

// подгрузка статических файлов из папки pages
app.use(express.static(path.join(__dirname, 'pages')));

// middleware для обработки данных в формате JSON
var jsonParser = bodyParser.json();
var textParser = bodyParser.text();
var urlencodedParser = bodyParser.urlencoded({ extended: true });

app.use(jsonParser);
app.use(textParser);
app.use(urlencodedParser);

// функция проверки авторизации
function checkAuth(req, res, next) {
    if (!req.cookies.user) {
        return res.redirect('/login');
    }
    next();
}

// загрузить таблицу с элементами
app.get('/', displayHandler.displayItems);

// загрузка страницы для создания нового элемента
app.get('/add', insertHandler.loadAddPage);
// добавить новый элемент
app.post('/add/newItem', insertHandler.addRow);

// отобразить элементы в режиме редактирования
app.get('/edit', checkAuth, displayHandler.displayItems);

// загрузка страницы для редактирования элементов
app.get('/edit/:id', editHandler.loadEditPage);

// редактирование элемента в бд
app.put('/edit/:id', editHandler.changeItem);

// удаление элемента из бд
app.delete('/edit/:id', editHandler.removeItem);

// обработка ошибок
app.use(function(err, req, res, next) {
    if (err) console.log(err.stack);
    res.status(500).send('oops...something went wrong');
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/login', async function(req, res) {
    const { username, password } = req.body;
    console.log(req.body)

    try {
        const pool = await mssqlPool;
        const request = pool.request();

        request.input('username', mssql.VarChar, username);
        request.input('password', mssql.VarChar, password);
        console.log(`Login:${username}`)
        console.log(`Password:${password}`)

        const result = await request.query('SELECT * FROM Admins WHERE Login = @username AND Password = @password');

        if (result.recordset.length > 0) {
            res.cookie('user', JSON.stringify(result.recordset[0]), { httpOnly: true });
            res.redirect('/edit');
        } else {
            res.render('login', { error: 'Invalid credentials' });
        }
    } catch (err) {
        console.log('Ошибка при выполнении запроса:', err);
        res.status(500).send('Server error');
    }
});

app.listen(port, function() {
    console.log(`app listening on port http://localhost:${port}`);
});
