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
        var methodDetails = "";
        ret += "### " + service.name + "\n";
        ret += toDescription(service.precomment, service.postcomment).long;
        ret += "\n\n";
        var rpcs = service.content.filter(function(a){return a.type == "rpc"});
        if (rpcs.length > 0){
          ret += "#### Method summary  \n";
          ret += "| Method Name | Param | Returns | Description |  \n";
          ret += "| --- | --- | --- | --- |  \n";
          for (j=0;j<rpcs.length;j++){
            var rpc = rpcs[j];
            var description = toDescription(rpc.precomment, rpc.postcomment);
            var name =  rpc.name;
            var linkdots = "";
            if (description.short != description.long){
              name = " ["+rpc.name+"](#"+rpc.name+")";
              linkdots = " [...](#"+rpc.name+")";
              methodDetails += "***\n<a id=\""+rpc.name.toLowerCase()+"\">  </a>";
              methodDetails += " **"+rpc.name+"**  \n";
              methodDetails += "rpc "+rpc.name+" ("+rpc.param+") returns ("+rpc.returns+") {}\n\n";
              methodDetails += description.long+"\n\n";
              methodDetails += "**Param:** "+toTypeLink(rpc.param)+"  \n";
              methodDetails += "**Returns:** "+toTypeLink(rpc.returns)+"  \n";
            }
            ret += "|" + name + " | "+ toTypeLink(rpc.param) + " | " + toTypeLink(rpc.returns) + " | " + description.short + linkdots+ " |  \n";
          }
          ret += "\n\n";
          if (methodDetails){
            ret += "#### Method details\n";
            ret += methodDetails;
          }
        }
      }
    }

    if (messages.length > 0){
      ret += "## Messages\n"
      for (i=0;i<messages.length; i++){
        var message = messages[i];
        ret += "### " + message.name + "\n";
        ret += toDescription(message.precomment, message.postcomment).long;
        ret += "\n\n";
        var fields = message.content.filter(function(a){return a.type == "field"});
        if (fields.length > 0){
          ret += "| Field | No | Type | Description | \n";
          ret += "| --- | --- | --- | --- | \n";
          for (j=0;j<fields.length;j++){
            var field = fields[j];
            var description = toDescription(field.precomment, field.postcomment);
            ret += "|" + field.name +  " | "+ field.fieldNo + " | "+   toTypeLink(field.typename) + " | " + description.long.replace(newline,"") +" | \n";
          }
          ret += "\n\n";
        }
      }
    }
    return ret
}

function toTypeLink(typename){
  typearr = typename.split(" ");
  var i = typearr.length-1;
  typearr[i] = (basicTypes.includes(typearr[i]) ? typearr[i] : ("[" + typearr[i] +"](#"+typearr[i] + ")"))
  return typearr.join("&nbsp;");
}

function firstLine(description){
  return (description.split(newline))[0];
}

function toDescription(precomment, postcomment){
  var desc = ((precomment?precomment.trim()+"  \n":"")+(postcomment?postcomment.trim():"")).trim();
  var ret = { long : desc, short : firstLine(desc) }
  return ret;
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