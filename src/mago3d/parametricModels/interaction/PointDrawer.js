'use strict';

/**
 * This is the interaction for draw point.
 * @class PointDrawer
 * 
 * @param {object} layer layer object.
 */

var PointDrawer = function() 
{
	if (!(this instanceof PointDrawer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	DrawGeometryInteraction.call(this);

    this.startDraw = false;
	this.result = [];
};
PointDrawer.prototype = Object.create(DrawGeometryInteraction.prototype);
PointDrawer.prototype.constructor = PointDrawer;

PointDrawer.prototype.init = function() 
{
	this.startDraw = false;
};
PointDrawer.prototype.clear = function() 
{
	this.init();
	var modeler = this.manager.modeler;
	var result = this.result;
	for (var i=0, len=result.length;i < len; i++) 
	{
		var rec = result[i];
		modeler.removeObject(rec);
	}
	this.result.length = 0;
};
PointDrawer.prototype.start = function() 
{
	if (!this.manager || !(this.manager instanceof MagoManager)) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}
	
	var that = this;
	var manager = that.manager;

    manager.on(MagoManager.EVENT_TYPE.LEFTDOWN, function(e)
	{
        if (!that.getActive()) { return; }
        if(!that.startDraw) {
            that.startDraw = true;
        }
		console.info(e);
	});
	manager.on(MagoManager.EVENT_TYPE.LEFTUP, function(e)
	{
        if (!that.getActive()) { return; }
        if(that.startDraw) {
            this.end();
            that.startDraw = true;
        }
		console.info(e);
	});
};

PointDrawer.prototype.end = function(start, end)
{
	this.init();
};