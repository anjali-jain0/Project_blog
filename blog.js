var express=require('express');
var app=express();
var nodemailer = require('nodemailer');
var server=require('http').createServer(app);
var io=require('socket.io').listen(server);

var session = require('express-session');
var flash=require('connect-flash');
var expressValidator=require('express-validator');

app.locals.moment = require('moment');

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static('./public'));

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));

app.use(require('connect-flash')());

app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});


app.use(expressValidator({
	expressFormatter: function(param,msg,value){
		var namespace = param.split('.')
		,root = namespace.shift()
		,formParam = root;

		while(namespace.length){
			formParam+= '[' + namespace.shift() + ']';
		}
		return{
			param : formParam,
			msg : msg,
			value : value
		};
	}
}));

var bodyParser=require('body-parser');

var urlencodedParser=bodyParser.urlencoded({extended: false});

var mongoose=require('mongoose');

mongoose.connect('mongodb://project:project2@ds125872.mlab.com:25872/blogpostproject2');

var project2Schema = new mongoose.Schema({
	title:String,
	category:String,
	author:String,
	body:String,
	date:Date,
	likes:{type:Number,default:0},
	time:String,
	comment:Array,
	postId:String,
	number:{type:Number,default:0}
});

var categoriesSchema = new mongoose.Schema({
	title:String,
	img:String
});

var Project2= mongoose.model('Project2',project2Schema);
var Pin= mongoose.model('Pin',project2Schema);
var Favourites= mongoose.model('Favourites',project2Schema);
var Liked= mongoose.model('Liked',project2Schema);

var postTwo= Project2({number:0,likes:40,time:'10 min',comment:[{name:'hey'}],title:'Blog Post One',category:'Technology',
	author:'Author 1',body:'This is blog1',date:'2-2-2018'}).save(function(err){
	if(err) throw err;

});
var postOne= Project2({number:0,likes:100,time:'20 min',comment:[],title:'Blog Post Two',category:'Fashion',
	author:'Author 2',body:'This is blog2',date:'3-5-2018'}).save(function(err){
	if(err) throw err;

});

var Categories= mongoose.model('Categories',categoriesSchema);

var category1=Categories({title:'Technology',img:'tech2.jpg'}).save(function(err){
	if(err) throw err;
});

var category2=Categories({title:'Fashion',img:'tech1.jpg'}).save(function(err){
	if(err) throw err;
});

app.get('/',function(req,res){

	Categories.find({},function(err,data){
			if(err) throw err;
			app.locals.categories=data;

	Project2.find({},function(err,data){
			if(err) throw err;
		    res.render('project2main',{posts:data});
});
});
});

app.get('/posts/add',function(req,res){
	res.render('project2addpost');
});

app.post('/posts/add',urlencodedParser,function(req,res){

	req.checkBody('title','title is required').notEmpty();
	req.checkBody('category','category is required').notEmpty();
	req.checkBody('author','author is required').notEmpty();
	req.checkBody('body','body is required').notEmpty();

		let errors = req.validationErrors();

		if(errors){
			res.render('project2errors',{errors:errors});
		}
		else
		{
		    var newPost= Project2({title:req.body.title,category:req.body.category,author:req.body.author,
		    	body:req.body.body,date:new Date()}).save(function(err){
        	if(err) throw err;
        });
        	res.redirect('/');
		}
});

app.get('/categories/add',function(req,res){

	res.render('project2addcategories');
});

app.get('/post/show/:id',function(req,res){
   
	Project2.findById(req.params.id,function(err,data){
		if(err) throw err;
		console.log(data);
		res.render('project2singlepost',{info:data});
	});
});

var no = 0;

app.get('/pin/:id',function(req,res){
 
 Project2.find({_id:req.params.id})
 .then(data => {
 	var ans=data[0];
 	Pin.find({postId:ans._id},function(err,data){
 		if(err) throw err;
 		else if(data.length==0){
 	    var pin1 = Pin({likes:ans.likes,postId:req.params.id,time:ans.time,comment:ans.comment,title:ans.title,category:ans.category,
 						author:ans.author,body:ans.body,date:ans.date,number:Number(Number(ans.number)+1)}).save(function(err){
 							if(err) throw err;
 						});
 		}
 	});
 		return 'true';
 	})
 	.then(data => {
 		return Project2.find({_id:req.params.id});
 	})
 	.then(data => {
 		var no = Number(data[0].number) + 1;
 		return Project2.updateOne({_id:req.params.id},{number:Number(no)});
 	})
 	// .then(res => {
 	// 	no++;
 	// io.sockets.on('connection', function(socket){
		// socket.emit('saveno', {no:no});
 	// 	});
 	// })
 	.then(data => {
 	res.redirect('/');
 });

});

app.get('/favourites/:id',function(req,res){
 
 Project2.find({_id:req.params.id}, function(err,data){
 	if(err) throw err;
 	if(data.length>0){
 		var ans=data[0];
 		var fav1 = Favourites({likes:ans.likes,postId:req.params.id,time:ans.time,comment:ans.comment,title:ans.title,category:ans.category,
 							   author:ans.author,body:ans.body,date:ans.date})
 							.save(function(err){
 								if(err) throw err;
 							});
 	}
 	res.redirect('/');
 });
});

app.get('/like/:id',function(req,res){
 
 Project2.find({_id:req.params.id})
 	.then(data => {
 		console.log(data);
 		var likes =  Number(data[0].likes) + 1;
 		return Project2.updateOne({_id:req.params.id} , {likes:Number(likes)});
 	})
 	.then(resp => {
 		console.log('updated');
 		return Project2.find({_id:req.params.id});
 	})
 	.then(data => {
 		var ans=data[0];
 		console.log(ans);
 		let liked1 = Liked({likes:ans.likes,postId:req.params.id,time:ans.time,comment:ans.comment,title:ans.title,
 							category:ans.category,author:ans.author,body:ans.body,date:ans.date});
 		return liked1.save();
 	})
 	.then(resp => {
 		console.log('added in liked posts');
 		res.redirect('/');
 	});
});

app.get('/unlike/:id',function(req,res){
 
 Project2.find({_id:req.params.id})
 	.then(data => {
 		var likes =  Number(data[0].likes) - 1;
 		return Project2.updateOne({_id:req.params.id} , {likes:likes});
 	})
 	.then(res => {
 		return Project2.find({_id:req.params.id});
 	})
 	.then(data => {
 		var ans=data[0];
 		var query = {likes:ans.likes,time:ans.time,comment:ans.comment,title:ans.title,category:ans.category,
 							   author:ans.author,body:ans.body,date:ans.date};
 		return Liked.remove(query);
 	})
 	.then(res => {
 		console.log('removed from liked posts');
 	});
});

app.get('/pinned',function(req,res){

	Pin.find({},function(err,data){
		if(err) throw err;
		res.render('project2pinned',{data:data});
	});
});


app.get('/liked',function(req,res){

	Liked.find({},function(err,data){
		if(err) throw err;
		res.render('project2liked',{data:data});
	});
});

app.get('/favourites' , function(req,res){

	Favourites.find({} , function(err,data){
		if(err) throw err;
		res.render('project2favourites' , {data:data})
	})
})

app.get('/unpin/:id',function(req,res){

	var query={_id:req.params.id};
	Pin.remove(query,function(err){
		if(err) throw err;
	});
	res.redirect('/pinned');
});


app.get('/delete/:id',function(req,res){

	var query2={postId:req.params.id}

	Pin.find(query2)
	.then(data => {
		if(data.length==0) return 'not here in pinned';
		Project2.find({_id:req.params.id},function(err,data){
			if(err) throw err;
			var no=Number(data[0].number)-1;
			Project2.updateOne({_id:req.params.id},{number:Number(no)},function(err){
				if(err) throw err;
			});
		});
		return Pin.remove(query2);
	})
	.then(res => {
	return Favourites.find(query2);
	})
	.then(data => {
		if(data.length==0) return 'not here in favourites';
		return Favourites.remove(query2);
	})
	.then(res => {
	return Liked.find(query2);
	})
	.then(data => {
		if(data.length==0) return 'not here in liked';
		return Liked.remove(query2);
	})
	.then(data => {
		console.log('removed successfully');
		res.redirect('/');
	});
});

app.get('/cmtlike/:id/:name/:email/:body',function(req,res){

	var query = {_id:req.params.id};
	var {name,email,body} = req.params;
	Project2.find(query,function(err,data){
		if(err) throw err;
		var cmt = data[0].comment;
		for(var i=0;i<cmt.length;i++){
			if(cmt[i].name == name && cmt[i].email == email && cmt[i].body == body){
				var likes = Number(cmt[i].likes);
				//Project2.updateOne(query,)
			}
		}
	})
});

app.get('/cmtdislike/:id/:name/:email/:body',function(req,res){

	var query = {_id:req.params.id};
	var {name,email,body} = req.params;
	Project2.find(query,function(err,data){
		if(err) throw err;
		var cmt = data[0].comment;
		for(var i=0;i<cmt.length;i++){
			if(cmt[i].name == name && cmt[i].email == email && cmt[i].body == body){
				var likes = Number(cmt[i].likes);
				//Project2.updateOne(query,)
			}
		}
	})
});


app.get('/notfavourites/:id',function(req,res){

	var query={_id:req.params.id};
	Favourites.remove(query,function(err){
		if(err) throw err;
	});
	res.redirect('/favourites');
});

app.post('/categories/add',urlencodedParser,function(req,res){

	req.checkBody('title','title is required').notEmpty();

		let errors2 = req.validationErrors();

		if(errors2){
			res.render('project2errors2',{errors2:errors2});
		}
		else
		{
		    var newCategory= Categories({title:req.body.title,img:req.body.img}).save(function(err){
        	if(err) throw err;
        });
		    res.redirect("/");
		}
});

app.get('/categories/show/:category/:img',function(req,res){
    
	Project2.find({category:req.params.category},function(err,data){
			if(err) throw err;
		    res.render('project2catwise',{title:req.params.category,img:req.params.img,posts:data});
});
});

app.post('/addcomment/:id',urlencodedParser,function(req,res){

	var cmt={name:req.body.name,body:req.body.body,email:req.body.email,likes:'0',dislikes:'0',commentdate:new Date()};
	var query={_id:req.params.id};
	Project2.update(query,{$push:{comment:cmt}},function(err){
		if(err) throw err;
	});
	res.redirect('/post/show/' + req.params.id);
});

app.post('/subscribe',urlencodedParser,function(req,res){
    
	var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "jainanjali043@gmail.com",
        pass: "anjali043"
    }
});

var mailOptions = {
  from: 'jainanjali043@gmail.com',
  to: req.body.email,
  subject: 'Subscription related mail',
  text: 'Hello and welcome to our site..Thankyou for subscribing..Further details will be informed to you via gmail..' 
};

transporter.sendMail(mailOptions, function(error, response){
  if (error) {
    console.log(error);
  } 
  else {
    console.log('Email sent: ' + response.message);
  }
});
res.redirect('/');
});



server.listen('8080');


