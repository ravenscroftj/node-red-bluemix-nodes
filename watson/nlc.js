/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {
  var cfenv = require('cfenv');

  var services = cfenv.getAppEnv().services, 
    service;

  var username, password;

  var service = cfenv.getAppEnv().getServiceCreds(/natural_language_classifier/i)

  if (service) {
    username = service.username;
    password = service.password;
  }

  RED.httpAdmin.get('/ibmwatson-nlc-classifier/vcap/', function (req, res) {
    res.json(service ? {bound_service: true} : null);
  });

  function Node(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    this.on('input', function (msg) {
      if (!msg.payload) {
        node.error('Missing property: msg.payload');
        return;
      }


      if (!msg.classifier && !this.credentials.classifier ) {
        node.error("Missing natural language classifier ID")
      }else if(!msg.classifier) {
        msg.classifier = this.credentials.classifier;
      }

      username = username || this.credentials.username;
      password = password || this.credentials.password;

      if (!username || !password) {
        node.error('Missing natural langauge classifier service credentials');
        return;
      }
 
      var watson = require('watson-developer-cloud');

      var nlClassifier = watson.natural_language_classifier({
        username: username,
        password: password,
        version: 'v1'

      });

      var params = {
        classifier: msg.classifier,
        text: msg.payload
      }

      nlClassifier.classify(params, function(err,results){
      
        if(err){
            node.error(err)
        }else{
            msg.classes = results.classes 
        }

        node.send(msg);
      
      })


    });
  }
  RED.nodes.registerType("watson-natural-language-classifier",Node,{
     credentials: {
      username: {type:"text"},
      password: {type:"password"},
      classifier: {type:"text"}
    }
  });
};
