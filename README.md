istar
=====

istar is a [SaaS] (Software as a Service) platform for [idock].


Features
--------

### Web client

* [Twitter Bootstrap] v2.0.3
* [HTML5 Boilerplate] v3.0.2
* [Modernizr] v2.5.3
* [jQuery] v1.7.2

### Web server

* [node.js] v0.6.18
* [express] v2.5.9

### Database

* [MongoDB] v2.0.5

### Workstations

* Intel Core i5-2400 CPU @ 3.10GHz
* 4GB DDR3 SDRAM
* Mac OS X Lion 10.7.4 Build 11E53
* [idock] v1.4


REST API
--------

### Get jobs

    curl http://istar.cse.cuhk.edu.hk:28017/istar/jobs/

### Post a new job

    curl -d $'receptor=ATOM      1  N   ASN A  21      63.845  98.298   0.035  1.00113.44    -0.066 N\nATOM      2  HN1 ASN A  21      64.058  99.036  -0.636  1.00  0.00     0.275 HD&center_x=1.234&center_y=5.678&center_z=9.012&size_x=20&size_y=18&size_z=22&description=Screen drug-like ligands for HIV RT&email=Jacky@cuhk.edu.hk' http://istar.cse.cuhk.edu.hk/jobs


Supported browsers
------------------

* Google Chrome 19
* Mozilla Firefox 12
* Microsoft Internet Explorer 9
* Apple Safari 5


Licenses
--------

* Code licensed under the [Apache License 2.0].
* Documentation licensed under [CC BY 3.0].


Contact Author
--------------

[Jacky Lee]


Logo
----

![istar logo](https://github.com/HongjianLi/istar/raw/master/public/img/logo.png)

The logo image is collected from [Open Clip Art].


[SaaS]: http://en.wikipedia.org/wiki/Software_as_a_service
[idock]: https://github.com/HongjianLi/idock
[Twitter Bootstrap]: https://github.com/twitter/bootstrap
[HTML5 Boilerplate]: https://github.com/h5bp/html5-boilerplate
[Modernizr]: https://github.com/Modernizr/Modernizr
[jQuery]: https://github.com/jquery/jquery
[node.js]: https://github.com/joyent/node
[express]: https://github.com/visionmedia/express
[MongoDB]: https://github.com/mongodb/mongo
[Apache License 2.0]: http://www.apache.org/licenses/LICENSE-2.0
[CC BY 3.0]: http://creativecommons.org/licenses/by/3.0
[Jacky Lee]: http://www.cse.cuhk.edu.hk/~hjli
[Open Clip Art]: http://www.openclipart.org
