var express = require('express');
var router = express.Router();

var model = require('../models/models');
var lock = require('../models/lock');
var urls = require("../address_configure");

var db = model.db;
var TICKET_DB = model.tickets;
var ACTIVITY_DB = model.activities;

function addZero(num)
{
    if (num<10)
        return "0"+num;
    return ""+num;
}
function getTime(datet,isSecond)
{
    if (!(datet instanceof Date))
        datet=new Date(datet);
    datet.getMinutes();
    return datet.getFullYear() + "-"
        + (datet.getMonth()+1) + "-"
        + (datet.getDate()) + " "
        + addZero(datet.getHours()) + ":"
        + addZero(datet.getMinutes())
        + (isSecond===true? ":"+datet.getSeconds() : "");
}

router.get("/", function(req, res, next)
{
    res.render("activity_checkinAll");
    return;
});

function checkValid(ticket,res, activityKey)
{
    if (ticket.status==2)
        return true;
    if (ticket.status==3)
    {
        res.json(
        {
            stuid: ticket.stu_id,
            activity: activityKey,
            msg: 'used',
            result: 'error'
        });
        return false;
    }
    if (ticket.status==0 || ticket.status==99)
    {
        res.json(
        {
            stuid: ticket.stu_id,
            activity: activityKey,
            msg: 'rejected',
            result: 'error'
        });
        return false;
    }
    if (ticket.status==1 && ticket.cost>0)
    {
        res.json(
        {
            stuid: ticket.stu_id,
            activity: activityKey,
            msg: 'nouser',
            result: 'error'
        });
        return false;
    }
    if (ticket.status==1)
        return true;

    res.json(
    {
        stuid: ticket.stu_id,
        activity: activityKey,
        msg: 'unknown',
        result: 'error'
    });
    return false;
}

router.post("/",function(req, res)
{
    var uid=req.body.uid;
    if (uid.length==32)
    {
        db[TICKET_DB].find({unique_id:uid},function(err, tik)
        {
            if (err || tik.length==0)
            {
                res.json(
                {
                    stuid: 'Unknown',
                    activity: 'Unknown',
                    msg: 'noticket',
                    result: 'error'
                });
                return;
            }

            db[ACTIVITY_DB].find({_id:tik[0].activity, status:1},function(err, docs){
        		if (err || docs.length==0)
		        {
		            res.json(
		            {
		                stuid: 'Unknown',
		                activity: 'Unknown',
		                msg: 'noact',
		                result: 'error'
		            });
		            return;
		        }
		        if (checkValid(tik[0],res, docs[0].key)){
		        	db[TICKET_DB].update({_id:tik[0]._id},
	                {
	                    $set:{status:3}
	                },function(err,result)
	                {
	                    if (err || result.n==0)
	                    {
	                        res.json(
	                        {
	                            stuid: tik[0].stu_id,
	                            activity: docs[0].key,
	                            msg: 'unknown',
	                            result: 'error'
	                        });
	                        return;
	                    }
	                    res.json(
	                    {
	                        stuid: tik[0].stu_id,
	                        activity: docs[0].key,
	                        msg: 'accepted',
	                        result: 'success'
	                    });
	                    return;
	                });
		        }
        	});
        });
    }
    else
    {
        res.json(
        {
            stuid: 'Unknown',
            activity: 'Unknown',
            msg: 'rejected',
            result: 'error'
        });
        return;
    }
    return;
});

module.exports = router;