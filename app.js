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



//função que faz o parser do xml online
// async function getData(url){
//   const res = await axios.get(url);
//   return await res.data;
// }

//variavel que armazena a query de saida
let final_qry = [];

// function setResult(produto){
//   return new Promisse ((resolve, reject) => {
//     final_qry.push(produto);
//   });  
// }

//função que acrescenta o elemento preco e seu valor no json produto
function setPrecoFromXML(url, produto) {

  //var preco;
  return new Promise (function(resolve, reject){
    request(url, function parseFromJson(error, response, body) {
      if(error) return reject(error);
      resolve(body);
    });
  });
  
  // request(url, function parseFromJson(error, response, body) {
  //   let doc = new dom().parseFromString(body);
  //   let nodes = xpath.select("//produto[@id="+ produto.id +"]/preco", doc);
    
  //   preco = nodes[0].firstChild.data;
  //   console.log(preco);
  // });

  // console.log(preco);
  // return preco;



  // getData(url)
  // .then(data => {
  //   let doc = new dom().parseFromString(data);
  //   let nodes = xpath.select("//produto[@id="+ produto.id +"]/preco", doc);
    
  //   //adciona o preco
  //   produto.preco = nodes[0].firstChild.data;
  //   console.log(produto);

  //   //joga o resultado num array 
  //   final_qry.push(produto); 
  // })
  // .catch(err => console.log(err));




  // axios.get(url)
  // .then(function (response){
  //   let doc = new dom().parseFromString(response.data);
  //   let nodes = xpath.select("//produto[@id="+ produto.id +"]/preco", doc);
    
  //   produto.preco = nodes[0].firstChild.data;
  //   console.log(produto);
  //   final_qry.push(produto); 
  // })
  // .catch(error => console.log(error));

}



//submete o formulario em get e renderiza a página
app.get('/submit-form-get', function (request, response) {


  db.query(
    'SELECT * FROM Produto WHERE nome LIKE :submit_nome',
    {params: {
       submit_nome: request.query.nome
     }
    }
  )
  .then(async function getResult(qry_result){
      try {
        final_qry = [];
        for (let i = 0; i < qry_result.length; i++) {
          let body = await setPrecoFromXML(precoUrl, qry_result[i]);
          let doc = new dom().parseFromString(body);
          let nodes = xpath.select("//produto[@id="+ qry_result[i].id +"]/preco", doc);
        
          let preco = nodes[0].firstChild.data;
          console.log(preco);
          qry_result[i].preco = preco;
          final_qry.push(qry_result[i]);
        }
        return final_qry;
      } catch(error){
          console.error(error);
      }

    })
  .then(function(final_qry){
    let keys = Object.keys(final_qry);

    response.render('resultados', {title: 'Resultados', chaves: keys,  produtos: final_qry});
    });


    //exibe na tela o resultado
    //let keys = Object.keys(final_qry);
    //response.render('resultados', {title: 'Resultados', chaves: keys,  produtos: final_qry});
    //return response.send(final_qry);

    // response.redirect(request.get('referer'));


    // for (let i = 0; i < qry_result.length; i++) {
    //   var preco = setPrecoFromXML(precoUrl, qry_result[i]);
    //   console.log(preco);
    //   qry_result[i].preco = preco;
    // }
     
    // final_qry = qry_result;

    // let doc = new dom().parseFromString(body);
    // let nodes = xpath.select("//produto[@id="+ produto.id +"]/preco", doc);
    
    // preco = nodes[0].firstChild.data;
    // console.log(preco);
});

//submete o formulario em post
app.post('/submit-form-post', function (request, response) {

  db.query(
    'SELECT * FROM Produto WHERE nome LIKE :submit_nome',
    {params: {
       submit_nome: request.body.nome
     }
    }
  ).then(
    function(qry_result){
      for (let i = 0; i < qry_result.length; i++) {
        setPrecoFromXML(precoUrl, qry_result[i]);
      }
    });
    response.render('resultados', {title: 'Resultados', produtos: final_qry});
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
