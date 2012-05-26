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

### Mail crawler

* [node.js] v0.6.18
* [contextio] v0.3.0

### Database

* [MongoDB] v2.0.5

### Workstations

* Intel Core i5-2400 CPU @ 3.10GHz
* 4GB DDR3 SDRAM
* Mac OS X Lion 10.7.4 Build 11E53
* Customized [idock] v1.4


Supported browsers
------------------

* Google Chrome 19
* Mozilla Firefox 12
* Microsoft Internet Explorer 9
* Apple Safari 5


RESTful API
-----------

### Get jobs

    curl http://istar.cse.cuhk.edu.hk:28017/istar/jobs/

### Post a new job

    curl -d $'receptor=ATOM      1  N   ASN A  21      63.845  98.298   0.035  1.00113.44    -0.066 N\nATOM      2  HN1 ASN A  21      64.058  99.036  -0.636  1.00  0.00     0.275 HD&center_x=1.234&center_y=5.678&center_z=9.012&size_x=20&size_y=18&size_z=22&description=Screen drug-like ligands for HIV RT&email=Jacky@cuhk.edu.hk' http://istar.cse.cuhk.edu.hk/jobs


Send email to submit job
------------------------

You can submit a new job simply by sending an email to [istar.cuhk@gmail.com], without opening your browser or programming against the restful api.

### Subject

The email subject must be your job description, e.g.

    Screen drug-like ligands for HIV RT

### Body

The email body must be your job configuration in JSON format, e.g.

    {
      "center_x": 1.234,
      "center_y": 5.678,
      "center_z": 9.012,
      "size_x": 20,
      "size_y": 18,
      "size_z": 22
    }

Note the double quotes around parameters.

### Attachment

The email attachment must contain your receptor in PDBQT format.

### Example

![istar mail example](https://github.com/HongjianLi/istar/mail.png)

Our email crawler retrieves new emails every hour. If your job is successfully created, you can see it at [istar] web site in an hour.


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
[contextio]: https://github.com/ContextIO/ContextIO-node
[MongoDB]: https://github.com/mongodb/mongo
[istar.cuhk@gmail.com]: mailto:istar.cuhk@gmail.com
[istar]: http://istar.cse.cuhk.edu.hk
[Apache License 2.0]: http://www.apache.org/licenses/LICENSE-2.0
[CC BY 3.0]: http://creativecommons.org/licenses/by/3.0
[Jacky Lee]: http://www.cse.cuhk.edu.hk/~hjli
[Open Clip Art]: http://www.openclipart.org
