// TODO: set loading notice
$(document).ready(function() {
  var delimeter = '/';
  var s3BaseUrl = location.protocol + '//' + location.hostname;
  var skipFile = 'index.html';
  $.get(s3BaseUrl)
   .done(function(data) {
     function toObjectUrl(objectName) { return s3BaseUrl + '/' + objectName; }
     function toDateString(rawDate) { return (new Date(rawDate)).toLocaleString(); }
     function toSizeString(rawSize) { return rawSize + ' bytes'; }
     function trimRight(str, delimeter) {
       while (str && str[str.length-1] === delimeter) { str = str.substr(0,str.length-1); }
       return str;
     }
     function findFolder(root, directory, level) {
       var dirNameBits = directory.split(delimeter),
           key = dirNameBits.slice(0, level+1).join(delimeter),
           title = dirNameBits[level],
           folder = null;
       if (level === dirNameBits.length) { return root; }
       //console.log('key = ' + key + '; title = ' + title + '; dirNameBits = ' + dirNameBits.join('.'));
       _.each(root, function(entry) { if (entry.key === key) { folder = entry; } });
       if (! folder) {
         folder = {
           key: key,
           title: title,
           folder: true,
           expanded: false,
           children: [ ]
         };
         root.push(folder);
       }
       return findFolder(folder.children, directory, level+1);
     }
     var xml = $(data);
     var folder, folders = { }, topLevel = [ ];
     _.map(xml.find('Contents'), function(item) {
       var item = $(item),
           objectName = item.find('Key').text(),
           rawDate = item.find('LastModified').text(),
           rawSize = item.find('Size').text(),
           objectMatch = objectName.match(new RegExp(/(.*\/)([^\/]+)$/)),
           directory,
           fileName;
       if (objectMatch) {
         directory = objectMatch[1];
         fileName = objectMatch[2];
       }
       else {
         directory = delimeter;
         fileName = objectName;
       }
       if (fileName !== skipFile) {
         directory = trimRight(directory, delimeter);
         if (! directory) { folder = topLevel; }
         else if (folders[directory]) { folder = folders[directory]; }
         else { folder = folders[directory] = findFolder(topLevel, directory, 0); }
         folder.push({ key: objectName,
                       title: '<a href="' + toObjectUrl(objectName) + '">' + fileName + '</a>',
                       href: toObjectUrl(objectName),
                       tooltip: 'Last modified: ' + toDateString(rawDate) + "\nSize: " + toSizeString(rawSize) });
       }
     });
     $("#tree").fancytree({
       source: topLevel,
       click: function(event, data) {
         if (data.href) {
           window.location.href = data.href;
         }
       }
     });
   })
   .fail(function(error) {
     alert('An error occurred: ' + error);
     console.log(error);
  });
});

