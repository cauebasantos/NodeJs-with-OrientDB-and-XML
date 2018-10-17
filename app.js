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

const db = new ODatabase({
   host:     'localhost',
   port:     2424,
   username: 'admin',
   password: 'admcorno123',
   name:     'estoque'
});

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

//Variavel que armazena a query de saida
let retorno_resultado = [];

const app = express();

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


//Função que acrescenta o elemento preco e seu valor no json produto
function getPrecoFromXML(url, produto) {

  return new Promise (function(resolve, reject){
    request(url, function parseFromJson(error, response, body) {
      if(error) return reject(error);
      resolve(body);
    });
  });

}

//Submete o formulario em get, realiza a query e renderiza a página
app.get('/submit-form-get', function (request, response) {
  let nome_produto = "%" + request.query.nome.toLowerCase() + "%";

  //Realiza a query e retorna os produtos que satisfaçam a condição
  db.query(
    'SELECT * FROM Produto WHERE nome.toLowerCase() LIKE :submit_nome',
    {params: {
       submit_nome: nome_produto
     }
    }
  ).then(async function getResult(query_resultado){
      try {
        retorno_resultado = [];

        //Para cada produto no resultado da query, busca
        //seu preço, incrementa ao produto e o trata para
        //ser renderizado pro cliente
        for (let i = 0; i < query_resultado.length; i++) {
          
          //Retorna os preços dos produtos, ainda com suas tags
          let body = await getPrecoFromXML(precoUrl, query_resultado[i]);
          let doc = new dom().parseFromString(body);

          //Retorna o preço respectivo ao id do atual produto
          //da iteração 
          let nodes = xpath.select("//produto[@id="+ query_resultado[i].id +"]/preco", doc);
          
          //Recupera o preço do resultado da query
          let preco = nodes[0].firstChild.data;

          //Acrescenta o atributo preço ao produto
          let produto = query_resultado[i];
          produto.preco = preco;
          
          //Faz o tratamento do produto adicionando ao seu nome 
          //o atributo que queremos que apareça para o cliente      
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

          if(produto.ano){
            produto.nome += " " + produto.ano;
          } 

          //Joga o produto no array de retorno
          retorno_resultado.push(produto);
        }
        
        return retorno_resultado;

      } catch(error){
          console.error(error);
      }

    }).then(function(resultado){
        //Renderiza na página resultados os produtos retornado pela query
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