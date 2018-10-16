/* jshint esversion: 6*/

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');

const ODatabase = require('orientjs').ODatabase;

const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

const request = require('request');

const axios = require('axios');

const precoUrl = 'https://sededaempresa.000webhostapp.com';

var db = new ODatabase({
   host:     'localhost',
   port:     2424,
   username: 'admin',
   password: 'admcorno123',
   name:     'estoque'
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(bodyParser.urlencoded({extended: true}));

//variavel que armazena a query de saida
let retorno_resultado = [];

//função que acrescenta o elemento preco e seu valor no json produto
function setPrecoFromXML(url, produto) {

  return new Promise (function(resolve, reject){
    request(url, function parseFromJson(error, response, body) {
      if(error) return reject(error);
      resolve(body);
    });
  });

}

//submete o formulario em get e renderiza a página
app.get('/submit-form-get', function (request, response) {
  let nome_produto = "%" + request.query.nome.toLowerCase() + "%";
  db.query(
    'SELECT * FROM Produto WHERE nome.toLowerCase() LIKE :submit_nome',
    {params: {
       submit_nome: nome_produto
     }
    }
  )
  .then(async function getResult(query_resultado){
      try {
        retorno_resultado = [];

        for (let i = 0; i < query_resultado.length; i++) {
          let body = await setPrecoFromXML(precoUrl, query_resultado[i]);
          let doc = new dom().parseFromString(body);
          let nodes = xpath.select("//produto[@id="+ query_resultado[i].id +"]/preco", doc);
          
          let preco = nodes[0].firstChild.data;

          let produto = query_resultado[i];
          produto.preco = preco;
          let tipo = '@type';
          let classe = '@class';
          let rid = '@rid';
          let versao =  '@version';

          delete produto[tipo]
          delete produto[classe];
          delete produto[rid];
          delete produto[versao];

          if(produto.marca){
            produto.nome += " " + produto.marca;
          } 

          if(produto.cor ){
            produto.nome += " " + produto.cor;
          } 

          if(produto.autor){
            produto.nome += " " + produto.autor;
          } 

          if(produto.isbn){
            produto.nome += " " + produto.isbn;
          } 

          retorno_resultado.push(produto);
        }
        
        return retorno_resultado;

      } catch(error){
          console.error(error);
      }

    })
  .then(function(resultado){

    response.render('resultados', {title: 'Resultados', produtos: resultado});
    });

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));

});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



app.listen(3000, function () {
    console.log("Express server listening on port 3000");

});

module.exports = app;
