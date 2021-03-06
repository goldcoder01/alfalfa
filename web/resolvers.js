/***********************************************************************************************************************
*  Copyright (c) 2008-2018, Alliance for Sustainable Energy, LLC, and other contributors. All rights reserved.
*
*  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
*  following conditions are met:
*
*  (1) Redistributions of source code must retain the above copyright notice, this list of conditions and the following
*  disclaimer.
*
*  (2) Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
*  disclaimer in the documentation and/or other materials provided with the distribution.
*
*  (3) Neither the name of the copyright holder nor the names of any contributors may be used to endorse or promote products
*  derived from this software without specific prior written permission from the respective party.
*
*  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER(S) AND ANY CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
*  INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
*  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER(S), ANY CONTRIBUTORS, THE UNITED STATES GOVERNMENT, OR THE UNITED
*  STATES DEPARTMENT OF ENERGY, NOR ANY OF THEIR EMPLOYEES, BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
*  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF
*  USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
*  STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
*  ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***********************************************************************************************************************/

import AWS from 'aws-sdk';
import request from 'superagent';

AWS.config.update({region: 'us-east-1'});
var sqs = new AWS.SQS();

function addSiteResolver(osmName, uploadID) {
  var params = {
   MessageBody: `{"op": "InvokeAction", "action": "addSite", "osm_name": "${osmName}", "upload_id": "${uploadID}"}`,
   QueueUrl: process.env.JOB_QUEUE_URL
  };
  
  sqs.sendMessage(params, (err, data) => {
    if (err) {
      callback(err);
    }
  });
}

function runSiteResolver(args) {
    //args: {
    //  siteRef : { type: new GraphQLNonNull(GraphQLString) },
    //  startDatetime : { type: GraphQLString },
    //  endDatetime : { type: GraphQLString },
    //  timescale : { type: GraphQLFloat },
    //  realtime : { type: GraphQLBoolean },
    //},
  return new Promise( (resolve,reject) => {
    request
    .post('/api/invokeAction')
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .send({
      "meta": {
        "ver": "2.0",
        "id": `r:${args.siteRef}`,
        "action": "s:runSite"
      },
      "cols": [
        {
          "name": "timescale"
        },
        {
          "name": "startDatetime"
        },
        {
          "name": "endDatetime"
        },
        {
          "name": "realtime"
        },
      ],
      "rows": [
        {
          "timescale": `n:${args.timescale}`,
          "startDatetime": `s:${args.startDatetime}`,
          "endDatetime": `s:${args.endDatetime}`,
          "realtime": `s:${args.realtime}`,
        }
      ]
    })
    .end((err, res) => {
      if( err ) {
        reject(err);
      } else {
        resolve(res.body);
      }
    })
  });
}

function stopSiteResolver(args) {
      //args: {
      //  siteRef : { type: new GraphQLNonNull(GraphQLString) },
      //},
  return new Promise( (resolve,reject) => {
    request
    .post('/api/invokeAction')
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .send({
      "meta": {
        "ver": "2.0",
        "id": `r:${args.siteRef}`,
        "action": "s:stopSite"
      },
      "cols": [
        {
          "name": "foo" // because node Haystack craps out if there are no columns
        },
      ],
      "rows": [
        {
          "foo": "s:bar",
        }
      ]
    })
    .end((err, res) => {
      if( err ) {
        reject(err);
      } else {
        resolve(res.body);
      }
    })
  });
}

function removeSiteResolver(args) {
      //args: {
      //  siteRef : { type: new GraphQLNonNull(GraphQLString) },
      //},
  return new Promise( (resolve,reject) => {
    request
    .post('/api/invokeAction')
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .send({
      "meta": {
        "ver": "2.0",
        "id": `r:${args.siteRef}`,
        "action": "s:removeSite"
      },
      "cols": [
        {
          "name": "foo" // because node Haystack craps out if there are no columns
        },
      ],
      "rows": [
        {
          "foo": "s:bar",
        }
      ]
    })
    .end((err, res) => {
      if( err ) {
        reject(err);
      } else {
        resolve(res.body);
      }
    })
  });
}

function  sitesResolver(user,siteRef) {
  let filter = "s:site";
  if( siteRef ) {
    filter = `${filter} and id==@${siteRef}`;
  }
  return new Promise( (resolve,reject) => {
    let sites = [];
    request
    .post('/api/read')
    .set('Accept', 'application/json')
    .send({
      "meta": {
        "ver": "2.0"
      },
      "cols": [
        {
          "name": "filter"
        }
      ],
      "rows": [
        {
          "filter": filter,
        }
      ]
    })
    .end((err, res) => {
      if( err ) {
        reject(err);
      } else {
        res.body.rows.map( (row) => {
          let site = {
            name: row.dis.replace(/[a-z]\:/,''),
            siteRef: row.id.replace(/[a-z]\:/,''),
            simStatus: row.simStatus.replace(/[a-z]\:/,''),
          };
          let datetime = row['datetime'];
          if( datetime ) {
            datetime = datetime.replace(/[a-z]\:/,'');
            site.datetime = datetime;
          }
          sites.push(site);
        });
        resolve(sites);
      }
    })
  });

    //name: {
    //  type: GraphQLString,
    //  description: 'The name of the site, corresponding to the haystack siteRef display name'
    //},
    //siteRef: {
    //  type: GraphQLString,
    //  description: 'A unique identifier, corresponding to the haystack siteRef value'
    //},
    //simStatus: {
    //  type: GraphQLString,
    //  description: 'The status of the site simulation'
    //}
}

function sitePointResolver(siteRef) {
  return new Promise( (resolve,reject) => {
    request
    .post('/api/read')
    .set('Accept', 'application/json')
    .send({
      "meta": {
        "ver": "2.0"
      },
      "cols": [
        {
          "name": "filter"
        }
      ],
      "rows": [
        {
          "filter": `s:point and siteRef==@${siteRef}`,
        }
      ]
    })
    .end((err, res) => {
      if( err ) {
        reject(err);
      } else {
        let points = [];
        let dis = 'Haystack Point';
        res.body.rows.map( (row) => {
          let tags = [];
          Object.keys(row).map((key) => {
            if( key == 'dis' ) {
              dis = row[key];
              if( dis ) {
                dis = dis.replace(/[a-z]\:/,'');
              }
            }
            let tag = {
              key: key,
              value: row[key]
            };
            tags.push(tag);
          });
          //let site = {
          //  name: row.dis.replace(/[a-z]\:/,''),
          //  siteRef: row.id.replace(/[a-z]\:/,''),
          //  simStatus: 'Stopped',
          //};
          let point = {
            dis: dis,
            tags: tags
          };
          points.push(point);
        });
        resolve(points);
      }
    })
  });
}

module.exports = { addSiteResolver, sitesResolver, runSiteResolver, stopSiteResolver, removeSiteResolver, sitePointResolver };

