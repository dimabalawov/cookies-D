const mssql = require('mssql');
const connection = require('./config');

module.exports = {
    tableRows: '',

    getAllItems: async function (req, res) {
    try {
        const pool = await connection;
        const request = new mssql.Request(pool);

        this.tableRows = ``;

        request.stream = true;
        const result = await request.query("SELECT * FROM items");

        if (result.recordset && result.recordset.length > 0) {
            result.recordset.forEach(row => {
                if (req.url == '/') {
                    this.tableRows += `<tr>
                                        <td>${row.name}</td>
                                        <td>${row.description}</td>
                                        <td>${row.completed ? 'yes' : 'no'}</td>
                                    </tr>`;
                } else {
                    this.tableRows += `<tr>
                                        <td><span class="glyphicon glyphicon-pencil edit" style="cursor: pointer" id="${row.id}"> &nbsp; </span>
                                        <span class="glyphicon glyphicon-remove delete" style="cursor: pointer" id="${row.id}"> &nbsp; </span>${row.name}</td>
                                        <td>${row.description}</td>
                                        <td>${row.completed ? 'yes' : 'no'}</td>
                                    </tr>`;
                }
            });
        } else {
            console.log('No items found.');
            this.tableRows = '<tr><td colspan="3">No items available.</td></tr>';
        }

        const options = { edit: req.url !== '/' };
        res.render('index', { data: this.tableRows, buttons: options.edit });
    } catch (err) {
        console.error('Ошибка при получении элементов:', err);
        res.status(500).send('Ошибка сервера');
    }
	},


    // добавить элемент в бд
    insertItem: async function (data, req, res) {
        try {
            const pool = await connection;
            const ps = new mssql.PreparedStatement(pool);

            ps.input('name', mssql.Text);
            ps.input('description', mssql.Text);
            ps.input('completed', mssql.Int);

            await ps.prepare("INSERT INTO items (name, description, completed) VALUES (@name, @description, @completed)");

            await ps.execute({
                name: data.name,
                description: data.description,
                completed: parseInt(data.completed)
            });

            await ps.unprepare();
            console.log('Item inserted');
        } catch (err) {
            console.error('Ошибка при вставке элемента:', err);
        }
    },

    // загрузить элемент из бд по id 
    loadItemById: async function (req, res) {
        try {
            const pool = await connection;
            const ps = new mssql.PreparedStatement(pool);

            ps.input('id', mssql.Int);
            await ps.prepare('SELECT * FROM items WHERE id=@id');

            const result = await ps.execute({ id: parseInt(req.params.id) });
            const row = result.recordset[0];

            res.render('edit_item_page', {
                id: row.id,
                name: row.name,
                description: row.description,
                completed: row.completed
            });

            await ps.unprepare();
        } catch (err) {
            console.error('Ошибка при загрузке элемента по ID:', err);
            res.status(500).send('Ошибка сервера');
        }
    },

    // обновить элемент 
    updateItem: async function (req, res) {
        try {
            const pool = await connection;
            const ps = new mssql.PreparedStatement(pool);

            ps.input('id', mssql.Int);
            ps.input('name', mssql.Text);
            ps.input('description', mssql.Text);
            ps.input('completed', mssql.Int);

            await ps.prepare("UPDATE items SET name=@name, description=@description, completed=@completed WHERE id=@id");

            await ps.execute({
                id: parseInt(req.body.id),
                name: req.body.name,
                description: req.body.description,
                completed: parseInt(req.body.completed)
            });

            await ps.unprepare();
            console.log('Item updated');
        } catch (err) {
            console.error('Ошибка при обновлении элемента:', err);
        }
    },

    // удалить элемент 
    deleteItem: async function (req, res) {
        try {
            const pool = await connection;
            const ps = new mssql.PreparedStatement(pool);

            ps.input('id', mssql.Int);
            await ps.prepare('DELETE FROM items WHERE id=@id');

            await ps.execute({ id: parseInt(req.params.id) });

            await ps.unprepare();
            console.log('Item deleted');
            res.send('OK');
        } catch (err) {
            console.error('Ошибка при удалении элемента:', err);
            res.status(500).send('Ошибка сервера');
        }
    }
};
