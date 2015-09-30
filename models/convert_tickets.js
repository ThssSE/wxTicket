var model = require('./models');

var table = model.db[model.tickets];
var c=0;

table.find({}).forEach(function(err,doc)
{
    if (err || !doc)
    {
        return;
    }
    table.update({_id:doc._id},
    {
        unique_id:  doc.unique_id,
        stu_id:     ""+doc.stu_id,
	activity: doc.activity,
	cost: doc.cost,
	seat: doc.seat,
        status:     doc.status
    },{},function()
    {
        c++;
        console.log("Record "+c+" modified successfully.");
    });
});
