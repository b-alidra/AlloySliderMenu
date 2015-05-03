var animateRight = Ti.UI.createAnimation({
	left : 270,
	curve : Ti.UI.ANIMATION_CURVE_EASE_OUT,
	duration : 150
});

var animateReset = Ti.UI.createAnimation({
	left : 0,
	curve : Ti.UI.ANIMATION_CURVE_EASE_OUT,
	duration : 150
});

var animateLeft = Ti.UI.createAnimation({
	left : -270,
	curve : Ti.UI.ANIMATION_CURVE_EASE_OUT,
	duration : 150
});

var touchStartX = 0;
var touchRightStarted = false;
var touchLeftStarted = false;
var buttonPressed = false;
var hasSlided = false;
var direction = "reset";

var menuOnLeft	= false;
var menuOnRight	= false;

$.movableview.addEventListener('touchstart', function(e) {
	touchStartX = e.x;
});

$.movableview.addEventListener('touchend', function(e) {
	if (buttonPressed) {
		buttonPressed = false;
		return;
	}
	if ($.movableview.left >= 150 && touchRightStarted && menuOnLeft) {
		direction = "right";
		$.leftButton.touchEnabled = false;
		$.movableview.animate(animateRight);
		hasSlided = true;
	}
	else if ($.movableview.left <= -150 && touchLeftStarted && menuOnRight) {
		direction = "left";
		$.rightButton.touchEnabled = false;
		$.movableview.animate(animateLeft);
		hasSlided = true;
	} else if (menuOnLeft || menuOnRight){
		direction = "reset";
		$.leftButton.touchEnabled = true;
		$.rightButton.touchEnabled = true;
		$.movableview.animate(animateReset);
		hasSlided = false;
	}
	Ti.App.fireEvent("sliderToggled", {
		hasSlided : hasSlided,
		direction : direction
	});
	touchRightStarted = false;
	touchLeftStarted = false;
});

$.movableview.addEventListener('touchmove', function(e) {
	var coords = $.movableview.convertPointToView({
		x : e.x,
		y : e.y
	}, $.containerview);
	var newLeft = coords.x - touchStartX;
	if ((touchRightStarted && newLeft <= 270 && newLeft >= 0) || 
		(touchLeftStarted && newLeft <= 0 && newLeft >= -270)) {
		$.movableview.left = newLeft;
	}
	else {
		// Sometimes newLeft goes beyond its bounds so the view gets stuck.
		// This is a hack to fix that.
		if ((touchRightStarted && newLeft < 0) || (touchLeftStarted && newLeft > 0)) {
			$.movableview.left = 0;
		}
		else if (touchRightStarted && newLeft > 270) {
			$.movableview.left = 270;
		}
		else if (touchLeftStarted && newLeft < -270) {
			$.movableview.left = -270;
		}
	}
	if (newLeft > 5 && !touchLeftStarted && !touchRightStarted && menuOnLeft) {
		touchRightStarted = true;
		Ti.App.fireEvent("sliderToggled", {
			hasSlided : false,
			direction : "right"
		});
	}
	else if (newLeft < -5 && !touchRightStarted && !touchLeftStarted && menuOnRight) {
		touchLeftStarted = true;
		Ti.App.fireEvent("sliderToggled", {
			hasSlided : false,
			direction : "left"
		});
	}
});

$.leftButton.addEventListener('touchend', function(e) {
	if (!touchRightStarted && !touchLeftStarted) {
		buttonPressed = true;
		$.toggleLeftSlider();
	}
});

$.rightButton.addEventListener('touchend', function(e) {
	if (!touchRightStarted && !touchLeftStarted) {
		buttonPressed = true;
		$.toggleRightSlider();
	}
});

$.searchButton.addEventListener('click', function(e) {
	Ti.App.fireEvent('searchButtonClick', e);
})

// Swap views on menu item click
$.leftTableView.addEventListener('click', function selectRow(e) {
	rowSelect(e.row);
	exports.toggleLeftSlider();
});
$.rightTableView.addEventListener('click', function selectRow(e) {
	rowSelect(e.row);
	exports.toggleRightSlider();
});

Ti.App.addEventListener("sliderToggled", function(e) {
	if (e.direction == "right" && menuOnLeft) {
		$.leftMenu.zIndex = 2;
		$.rightMenu.zIndex = 1;
	} else if (e.direction == "left" && menuOnRight) {
		$.leftMenu.zIndex = 1;
		$.rightMenu.zIndex = 2;
	}
});

exports.toggleLeftSlider = function() {
	if (!hasSlided) {
		direction = "right";
		$.leftButton.touchEnabled = false;
		$.movableview.animate(animateRight);
		hasSlided = true;
	} else {
		direction = "reset";
		$.leftButton.touchEnabled = true;
		$.movableview.animate(animateReset);
		hasSlided = false;
	}
	Ti.App.fireEvent("sliderToggled", {
		hasSlided : hasSlided,
		direction : direction
	});
};

exports.toggleRightSlider = function() {
	if (!hasSlided) {
		direction = "left";
		$.rightButton.touchEnabled = false;
		$.movableview.animate(animateLeft);
		hasSlided = true;
	} else {
		direction = "reset";
		$.rightButton.touchEnabled = true;
		$.movableview.animate(animateReset);
		hasSlided = false;
	}
	Ti.App.fireEvent("sliderToggled", {
		hasSlided : hasSlided,
		direction : direction
    });
};

exports.handleRotation = function() {
/*
  	Add the orientation handler in the controller that loads this widget. Like this:
	Ti.Gesture.addEventListener('orientationchange', function() {
		$.ds.handleRotation();
	});
*/
	$.movableview.width = $.navview.width = $.contentview.width = Ti.Platform.displayCaps.platformWidth;
	$.movableview.height = /*$.navview.height = */$.contentview.height = Ti.Platform.displayCaps.platformHeight;
};

/*Ti.Gesture.addEventListener('orientationchange', function() {
	exports.handleRotation();
});*/

var currentTitle = null;
var currentView = null;

var rowSelect = function(row) {
	if (null == currentView || currentTitle != row.customTitle.text) {
		if (null != currentView) {
			$.contentview.remove(currentView);
		} 
		$.screenTitle.text	= row.customTitle.text;
		if (row.customWidget == '') {
			currentView	= Alloy.createController(row.customView).getView();	
		}
		else {
			var widget	= row.customWidget.toLowerCase(); 
			currentView	= Alloy.createWidget(widget, row.customView, row.customParams).getView();
		}
		$.contentview.add(currentView);
		currentTitle = row.customTitle.text;
	}
};

exports.init = function(rows) {
 	currentView		= null;
 	currentTitle	= null;	
 	
 	$.contentview.removeAllChildren();
 	$.leftTableView.removeAllChildren();
 	$.rightTableView.removeAllChildren();
 	
	var params		= [];
	var links		= Alloy.Globals.config.navigation.links;
	
	for(var i = 0, l = links.length; i < l; i++) {
		var link = links[i];
		row = exports.addMenuRow(link.title, link.icon, link.target.widget, link.target.view, link.target.params, "left");
		
		if (i == 0) {
			rowSelect(row);
		}
	}
};

exports.addView = function(view) {
	$.contentview.add(view);
	if ($.contentview.getChildren().length == 1) {
		currentView = view;
	}
};

exports.addMenuRow = function(title, icon, widget, view, params, pos) {
	pos = pos || 'left';
	var args = {
		title : title,
		customWidget : widget,
		customView : view,
		customParams : params,
		icon : icon
	};
	var row = Widget.createController('menurow', args).getView();
	pos == 'left' ? $.leftTableView.appendRow(row) : $.rightTableView.appendRow(row);
	pos == 'left' ? menuOnLeft = true : menuOnRight = true;
	pos == 'left' ? $.leftButton.visible = true : $.rightButton.visible = true;
	 
	return row;
};