const protoParser = require('../parser.js');

const basicTypes = [ "double","float" , "int32" , "int64" , "uint32" , "uint64" , "sint32" , "sint64" , "fixed32" , "fixed64" , "sfixed32" , "sfixed64" , "bool" , "string" , "bytes" ];
const newline = /(?:\r\n|\r|\n)/g;

function loadFile(filename){
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", filename, false);
        xhttp.send(null);
        return xhttp.response || "error";
}

function protodoc(filename){
    var content = loadFile(filename)
    var proto = protoParser.parse(content);
    var rpcArr = []
    var ret = ""

    var services = proto.content.filter(function(a){return a.type == "service"});
    var messages = proto.content.filter(function(a){return a.type == "message"});


    if (services.length > 0){
      ret += "## Services\n"
      for (i=0;i<services.length; i++){
        var service = services[i];
        ret += "### " + service.name + "\n";
        ret += toDescription(service.precomment, service.postcomment);
        ret += "\n\n";
        var rpcs = service.content.filter(function(a){return a.type == "rpc"});
        if (rpcs.length > 0){
          ret += "| Method Name | Param | Returns | Description |  \n";
          ret += "| --- | --- | --- | --- |  \n";
          for (j=0;j<rpcs.length;j++){
            var rpc = rpcs[j];
            ret += "|" + rpc.name + " | "+ toTypeLink(rpc.param) + " | " + toTypeLink(rpc.returns) + " | " + toDescription(rpc.precomment, rpc.postComment).replace(newline,"") + " |  \n";
          }
          ret += "\n\n";
        }
      }
    }

    if (messages.length > 0){
      ret += "## Messages\n"
      for (i=0;i<messages.length; i++){
        var message = messages[i];
        ret += "### " + message.name + "\n";
        ret += toDescription(message.precomment, message.postcomment);
        ret += "\n\n";
        var fields = message.content.filter(function(a){return a.type == "field"});
        if (fields.length > 0){
          ret += "| Field | No | Type | Description | \n";
          ret += "| --- | --- | --- | --- | \n";
          for (j=0;j<fields.length;j++){
            var field = fields[j];
            ret += "|" + field.name +  " | "+ field.fieldNo + " | "+   toTypeLink(field.typename) + " | " + toDescription(field.precomment, field.postcomment).replace(newline,"") +" | \n";
          }
          ret += "\n\n";
        }
      }
    }
    return ret
}

function toTypeLink(typename){
  typearr = typename.split(" ");
  typearr[0] = (basicTypes.includes(typearr[0]) ? typearr[0] : ("[" + typearr[0] +"](#"+typearr[0] + ")"))
  return typearr.join("&nbsp;");
}

function toDescription(precomment, postcomment){
  return ((precomment?precomment:"")+(postcomment?postcomment:""));
}

function install(hook,vm){
     hook.beforeEach(function(markdown, next) {
        var ret = markdown.replace(/\[[^\]]*\]\(([^']*)':protodoc'\)/g, function(a, filename){return protodoc(filename)})
        next(ret)
    })
}

if (!window.$docsify) {
    window.$docsify = {}
  }
  
window.$docsify.plugins = (window.$docsify.plugins || []).concat(install)