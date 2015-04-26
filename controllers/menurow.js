var args			= arguments[0] || {};
$.fa.add($.icon, args.icon);
$.title.text		= args.title || '';
$.row.customView	= args.customView || '';
$.row.customWidget	= args.customWidget || '';
$.row.customParams	= args.customParams || '';
$.row.customTitle	= $.title;