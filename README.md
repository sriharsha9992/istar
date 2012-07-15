istar
=====

istar is a [SaaS] (Software as a Service) platform for [idock] and [igrep].


Architecture
------------

![istar architecture](https://github.com/HongjianLi/istar/raw/master/public/architecture.png)


Features
--------

### Web client

* [Twitter Bootstrap] v2.0.3
* [HTML5 Boilerplate] v3.0.2
* [Modernizr] v2.5.3
* [jQuery] v1.7.2

### Web server

* [node.js] v0.8.2
* [carrier] v0.1.7
* [express] v2.5.9
* [validator] v0.4.6
* [mongodb] v1.0.2

### Mail crawler

* [node.js] v0.8.2
* [contextio] v0.3.0
* [validator] v0.4.6
* [mongodb] v1.0.2

### Database

* [MongoDB] v2.0.6

### Workstations

* Intel Core i5-2400 CPU @ 3.10GHz
* 4GB DDR3 SDRAM
* Mac OS X Lion 10.7.4 Build 11E53
* Customized [idock] v1.5


Supported browsers
------------------

* Google Chrome 19+
* Mozilla Firefox 12+
* Microsoft Internet Explorer 9+
* Apple Safari 5+


RESTful API
-----------

### Get jobs

    curl -Gd 'email=Jacky@cuhk.edu.hk' http://istar.cse.cuhk.edu.hk/idock/jobs

### Post a new job

    curl -d $'receptor=
    ATOM      1  N   ASN A  21      63.845  98.298   0.035  1.00113.44    -0.066 N\n
    ATOM      2  HN1 ASN A  21      64.058  99.036  -0.636  1.00  0.00     0.275 HD&
    center_x=1.234&center_y=5.678&center_z=9.012&
    size_x=20&size_y=18&size_z=22&
    description=Screen drug-like ligands for HIV RT&
    email=Jacky@cuhk.edu.hk&
    mwt_lb=400&mwt_ub=500&logp_lb=0&logp_ub=5&nrb_lb=2&nrb_ub=8&
    hbd_lb=2&hbd_ub=5&hba_lb=2&hba_ub=10&charge_lb=0&charge_ub=0&
    ad_lb=0&ad_ub=12&pd_lb=-50&pd_ub=0&tpsa_lb=20&tpsa_ub=100'
    http://istar.cse.cuhk.edu.hk/idock/jobs

### Get the number of ligands satisfying filtering conditions

    curl -Gd
    mwt_lb=400&mwt_ub=500&logp_lb=0&logp_ub=5&nrb_lb=2&nrb_ub=8&
    hbd_lb=2&hbd_ub=5&hba_lb=2&hba_ub=10&charge_lb=0&charge_ub=0&
    ad_lb=0&ad_ub=12&pd_lb=-50&pd_ub=0&tpsa_lb=20&tpsa_ub=100
    http://istar.cse.cuhk.edu.hk/idock/ligands


Send email to submit job
------------------------

You can submit a new job simply by sending an email to [istar.cuhk@gmail.com].

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
      "size_z": 22,
      "mwt_lb": 400,
      "mwt_ub": 500,
      "logp_lb": 0,
      "logp_ub": 5,
      "nrb_lb": 2,
      "nrb_ub": 8,
      "hbd_lb": 2,
      "hbd_ub": 5,
      "hba_lb": 2,
      "hba_ub": 10,
      "charge_lb": 0,
      "charge_ub": 0,
      "ad_lb": 0,
      "ad_ub": 12,
      "pd_lb": -50,
      "pd_ub": 0,
      "tpsa_lb": 20,
      "tpsa_ub": 100
    }

Note the necessary double quotes around parameters. The first 6 arguments ``center_x``, ``center_y``, ``center_z``, ``size_x``, ``size_y`` and ``size_z`` are compulsory while the rest are optional. Make sure there is no signature.

### Attachment

The email attachment must contain your receptor in PDBQT format.

### Example

![istar mail example](https://github.com/HongjianLi/istar/raw/master/public/idock/mailsnd.png)

Our email crawler retrieves new emails every hour. If your job is successfully created, you should see it at [istar] web site in an hour.


Licenses
--------

* Code licensed under the [Apache License 2.0].
* Documentation licensed under [CC BY 3.0].


Contact Author
--------------

[Jacky Lee]


Logo
----

![istar logo](https://github.com/HongjianLi/istar/raw/master/public/logo.png)

The logo image is collected from [Open Clip Art].


[SaaS]: http://en.wikipedia.org/wiki/Software_as_a_service
[idock]: https://github.com/HongjianLi/idock
[idock]: http://istar.cse.cuhk.edu.hk/igrep
[Twitter Bootstrap]: https://github.com/twitter/bootstrap
[HTML5 Boilerplate]: https://github.com/h5bp/html5-boilerplate
[Modernizr]: https://github.com/Modernizr/Modernizr
[jQuery]: https://github.com/jquery/jquery
[node.js]: https://github.com/joyent/node
[express]: https://github.com/visionmedia/express
[carrier]: https://github.com/pgte/carrier
[express-validator]: https://github.com/ctavan/express-validator
[mongodb]: https://github.com/mongodb/node-mongodb-native
[contextio]: https://github.com/ContextIO/ContextIO-node
[validator]: https://github.com/chriso/node-validator
[MongoDB]: https://github.com/mongodb/mongo
[istar.cuhk@gmail.com]: mailto:istar.cuhk@gmail.com
[istar]: http://istar.cse.cuhk.edu.hk
[Apache License 2.0]: http://www.apache.org/licenses/LICENSE-2.0
[CC BY 3.0]: http://creativecommons.org/licenses/by/3.0
[Jacky Lee]: http://www.cse.cuhk.edu.hk/~hjli
[Open Clip Art]: http://www.openclipart.org
