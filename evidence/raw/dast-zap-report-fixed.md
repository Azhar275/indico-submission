# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 1 |
| Informational | 4 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 9    |
| Info | Informational |  | Percentage of network failures | 1 % |
| Info | Informational | http://app:3000 | Percentage of responses with status code 2xx | 50 % |
| Info | Exceeded Low | http://app:3000 | Percentage of responses with status code 4xx | 49 % |
| Info | Informational | http://app:3000 | Percentage of endpoints with content type application/json | 100 % |
| Info | Informational | http://app:3000 | Percentage of endpoints with method GET | 73 % |
| Info | Informational | http://app:3000 | Percentage of endpoints with method POST | 26 % |
| Info | Informational | http://app:3000 | Count of total endpoints | 130    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Cross Site Scripting Weakness (Persistent in JSON Response) | Low | 2 |
| A Client Error response code was returned by the server | Informational | 132 |
| Authentication Request Identified | Informational | 1 |
| Non-Storable Content | Informational | Systemic |
| User Agent Fuzzer | Informational | Systemic |




## Alert Detail



### [ Cross Site Scripting Weakness (Persistent in JSON Response) ](https://www.zaproxy.org/docs/alerts/40014/)



##### Low (Low)

### Description

A XSS attack was found in a JSON response, this might leave content consumers vulnerable to attack if they don't appropriately handle the data (response).

* URL: http://app:3000/items
  * Node Name: `http://app:3000/items`
  * Method: `GET`
  * Parameter: `description`
  * Attack: `<script>alert(1);</script>`
  * Evidence: ``
  * Other Info: `Raised with LOW confidence as the Content-Type is not HTML.`
* URL: http://app:3000/items
  * Node Name: `http://app:3000/items`
  * Method: `GET`
  * Parameter: `name`
  * Attack: `<script>alert(1);</script>`
  * Evidence: ``
  * Other Info: `Raised with LOW confidence as the Content-Type is not HTML.`


Instances: 2

### Solution

Phase: Architecture and Design
Use a vetted library or framework that does not allow this weakness to occur or provides constructs that make this weakness easier to avoid.
Examples of libraries and frameworks that make it easier to generate properly encoded output include Microsoft's Anti-XSS library, the OWASP ESAPI Encoding module, and Apache Wicket.

Phases: Implementation; Architecture and Design
Understand the context in which your data will be used and the encoding that will be expected. This is especially important when transmitting data between different components, or when generating outputs that can contain multiple encodings at the same time, such as web pages or multi-part mail messages. Study all expected communication protocols and data representations to determine the required encoding strategies.
For any data that will be output to another web page, especially any data that was received from external inputs, use the appropriate encoding on all non-alphanumeric characters.
Consult the XSS Prevention Cheat Sheet for more details on the types of encoding and escaping that are needed.

Phase: Architecture and Design
For any security checks that are performed on the client side, ensure that these checks are duplicated on the server side, in order to avoid CWE-602. Attackers can bypass the client-side checks by modifying values after the checks have been performed, or by changing the client to remove the client-side checks entirely. Then, these modified values would be submitted to the server.

If available, use structured mechanisms that automatically enforce the separation between data and code. These mechanisms may be able to provide the relevant quoting, encoding, and validation automatically, instead of relying on the developer to provide this capability at every point where output is generated.

Phase: Implementation
For every web page that is generated, use and specify a character encoding such as ISO-8859-1 or UTF-8. When an encoding is not specified, the web browser may choose a different encoding by guessing which encoding is actually being used by the web page. This can cause the web browser to treat certain sequences as special, opening up the client to subtle XSS attacks. See CWE-116 for more mitigations related to encoding/escaping.

To help mitigate XSS attacks against the user's session cookie, set the session cookie to be HttpOnly. In browsers that support the HttpOnly feature (such as more recent versions of Internet Explorer and Firefox), this attribute can prevent the user's session cookie from being accessible to malicious client-side scripts that use document.cookie. This is not a complete solution, since HttpOnly is not supported by all browsers. More importantly, XMLHTTPRequest and other powerful browser technologies provide read access to HTTP headers, including the Set-Cookie header in which the HttpOnly flag is set.

Assume all input is malicious. Use an "accept known good" input validation strategy, i.e., use an allow list of acceptable inputs that strictly conform to specifications. Reject any input that does not strictly conform to specifications, or transform it into something that does. Do not rely exclusively on looking for malicious or malformed inputs (i.e., do not rely on a deny list). However, deny lists can be useful for detecting potential attacks or determining which inputs are so malformed that they should be rejected outright.

When performing input validation, consider all potentially relevant properties, including length, type of input, the full range of acceptable values, missing or extra inputs, syntax, consistency across related fields, and conformance to business rules. As an example of business rule logic, "boat" may be syntactically valid because it only contains alphanumeric characters, but it is not valid if you are expecting colors such as "red" or "blue."

Ensure that you perform input validation at well-defined interfaces within the application. This will help protect the application even if a component is reused or moved elsewhere.
	

### Reference


* [ https://owasp.org/www-community/attacks/xss/ ](https://owasp.org/www-community/attacks/xss/)
* [ https://cwe.mitre.org/data/definitions/79.html ](https://cwe.mitre.org/data/definitions/79.html)


#### CWE Id: [ 79 ](https://cwe.mitre.org/data/definitions/79.html)


#### WASC Id: 8

#### Source ID: 1

### [ A Client Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Informational (High)

### Description

A response code of 401 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://app:3000
  * Node Name: `http://app:3000`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000%3Faaa=bbb
  * Node Name: `http://app:3000 (aaa)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000%3Fclass.module.classLoader.DefaultAssertionStatus=nonsense
  * Node Name: `http://app:3000 (class.module.classLoader.DefaultAssertio...)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/
  * Node Name: `http://app:3000/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/%3Fname=abc
  * Node Name: `http://app:3000/ (name)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.DS_Store
  * Node Name: `http://app:3000/.DS_Store`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/._darcs
  * Node Name: `http://app:3000/._darcs`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.bzr
  * Node Name: `http://app:3000/.bzr`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.env
  * Node Name: `http://app:3000/.env`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.git/config
  * Node Name: `http://app:3000/.git/config`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.hg
  * Node Name: `http://app:3000/.hg`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.htaccess
  * Node Name: `http://app:3000/.htaccess`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.idea/WebServers.xml
  * Node Name: `http://app:3000/.idea/WebServers.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.php_cs.cache
  * Node Name: `http://app:3000/.php_cs.cache`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.ssh/id_dsa
  * Node Name: `http://app:3000/.ssh/id_dsa`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.ssh/id_rsa
  * Node Name: `http://app:3000/.ssh/id_rsa`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.svn/entries
  * Node Name: `http://app:3000/.svn/entries`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.svn/wc.db
  * Node Name: `http://app:3000/.svn/wc.db`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/.zap1590607735216856457
  * Node Name: `http://app:3000/.zap1590607735216856457`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/5668330688252360504
  * Node Name: `http://app:3000/5668330688252360504`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/BitKeeper
  * Node Name: `http://app:3000/BitKeeper`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/CHANGELOG.txt
  * Node Name: `http://app:3000/CHANGELOG.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/CVS/root
  * Node Name: `http://app:3000/CVS/root`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/DEADJOE
  * Node Name: `http://app:3000/DEADJOE`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/FileZilla.xml
  * Node Name: `http://app:3000/FileZilla.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/WEB-INF/applicationContext.xml
  * Node Name: `http://app:3000/WEB-INF/applicationContext.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/WEB-INF/web.xml
  * Node Name: `http://app:3000/WEB-INF/web.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/WS_FTP.INI
  * Node Name: `http://app:3000/WS_FTP.INI`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/WS_FTP.ini
  * Node Name: `http://app:3000/WS_FTP.ini`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/WinSCP.ini
  * Node Name: `http://app:3000/WinSCP.ini`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/_framework/blazor.boot.json
  * Node Name: `http://app:3000/_framework/blazor.boot.json`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/_wpeprivate/config.json
  * Node Name: `http://app:3000/_wpeprivate/config.json`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/adminer.php
  * Node Name: `http://app:3000/adminer.php`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/api-docs
  * Node Name: `http://app:3000/api-docs ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/app/etc/local.xml
  * Node Name: `http://app:3000/app/etc/local.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth
  * Node Name: `http://app:3000/auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth%3Fclass.module.classLoader.DefaultAssertionStatus=nonsense
  * Node Name: `http://app:3000/auth (class.module.classLoader.DefaultAssertio...)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth%3Fname=abc
  * Node Name: `http://app:3000/auth (name)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/
  * Node Name: `http://app:3000/auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/.env
  * Node Name: `http://app:3000/auth/.env`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/.htaccess
  * Node Name: `http://app:3000/auth/.htaccess`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/2335826784830036911
  * Node Name: `http://app:3000/auth/2335826784830036911`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/actuator/health
  * Node Name: `http://app:3000/auth/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/login%3Fclass.module.classLoader.DefaultAssertionStatus=nonsense
  * Node Name: `http://app:3000/auth/login (class.module.classLoader.DefaultAssertio...)({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/login%3Fname=abc
  * Node Name: `http://app:3000/auth/login (name)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/trace.axd
  * Node Name: `http://app:3000/auth/trace.axd`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/composer.json
  * Node Name: `http://app:3000/composer.json`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/composer.lock
  * Node Name: `http://app:3000/composer.lock`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/config/database.yml
  * Node Name: `http://app:3000/config/database.yml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/config/databases.yml
  * Node Name: `http://app:3000/config/databases.yml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/core
  * Node Name: `http://app:3000/core`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/docs/
  * Node Name: `http://app:3000/docs/ ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/elmah.axd
  * Node Name: `http://app:3000/elmah.axd`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/filezilla.xml
  * Node Name: `http://app:3000/filezilla.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/i.php
  * Node Name: `http://app:3000/i.php`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/id_dsa
  * Node Name: `http://app:3000/id_dsa`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/id_rsa
  * Node Name: `http://app:3000/id_rsa`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/info.php
  * Node Name: `http://app:3000/info.php`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/items/.env
  * Node Name: `http://app:3000/items/.env`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/items/.htaccess
  * Node Name: `http://app:3000/items/.htaccess`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/items/2573964746360228467
  * Node Name: `http://app:3000/items/2573964746360228467`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/items/search%3Fq=%253B+select+%2522java.lang.Thread.sleep%2522%252815000%2529+from+INFORMATION_SCHEMA.SYSTEM_COLUMNS+where+TABLE_NAME+%253D+%2527SYSTEM_COLUMNS%2527+and+COLUMN_NAME+%253D+%2527TABLE_NAME%2527+--+
  * Node Name: `http://app:3000/items/search (q)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/items/trace.axd
  * Node Name: `http://app:3000/items/trace.axd`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/key.pem
  * Node Name: `http://app:3000/key.pem`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/lfm.php
  * Node Name: `http://app:3000/lfm.php`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/myserver.key
  * Node Name: `http://app:3000/myserver.key`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/openapi.json
  * Node Name: `http://app:3000/openapi.json ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/openapi.yaml
  * Node Name: `http://app:3000/openapi.yaml ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/phpinfo.php
  * Node Name: `http://app:3000/phpinfo.php`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/privatekey.key
  * Node Name: `http://app:3000/privatekey.key`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/server-info
  * Node Name: `http://app:3000/server-info`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/server-status
  * Node Name: `http://app:3000/server-status`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/server.key
  * Node Name: `http://app:3000/server.key`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/sftp-config.json
  * Node Name: `http://app:3000/sftp-config.json`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/sitemanager.xml
  * Node Name: `http://app:3000/sitemanager.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/sites/default/files/.ht.sqlite
  * Node Name: `http://app:3000/sites/default/files/.ht.sqlite`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/sites/default/private/files/backup_migrate/scheduled/test.txt
  * Node Name: `http://app:3000/sites/default/private/files/backup_migrate/scheduled/test.txt`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/swagger
  * Node Name: `http://app:3000/swagger ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/swagger-ui/
  * Node Name: `http://app:3000/swagger-ui/ ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/swagger-ui/index.html
  * Node Name: `http://app:3000/swagger-ui/index.html ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/swagger.json
  * Node Name: `http://app:3000/swagger.json ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/swagger.yaml
  * Node Name: `http://app:3000/swagger.yaml ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/swagger/ui/index.html
  * Node Name: `http://app:3000/swagger/ui/index.html ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/test.php
  * Node Name: `http://app:3000/test.php`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/trace.axd
  * Node Name: `http://app:3000/trace.axd`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/v2/api-docs
  * Node Name: `http://app:3000/v2/api-docs ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/v3/api-docs
  * Node Name: `http://app:3000/v3/api-docs ()({email,password})`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/vb_test.php
  * Node Name: `http://app:3000/vb_test.php`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/vim_settings.xml
  * Node Name: `http://app:3000/vim_settings.xml`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/winscp.ini
  * Node Name: `http://app:3000/winscp.ini`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/ws_ftp.ini
  * Node Name: `http://app:3000/ws_ftp.ini`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/zap7301721465930440904
  * Node Name: `http://app:3000/zap7301721465930440904`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000
  * Node Name: `http://app:3000 ()(class.module.classLoader.DefaultAssertio...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/ (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('cmd.exe /C echo djlhad8ggmnp...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/ (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('echo djlhad8ggmnph7mhvw48',$...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth
  * Node Name: `http://app:3000/auth ()(class.module.classLoader.DefaultAssertio...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/auth (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('cmd.exe /C echo djlhad8ggmnp...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/auth (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('echo djlhad8ggmnph7mhvw48',$...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()(------b82ebf8e-a046-4265-87c1-7e0cde9675dd
Content-Disposition: form-data; name="1"

{}
------b82ebf8e-a046-4265-87c1-7e0cde9675dd
Content-Disposition: form-data; name="0"

["$1:a:a"]
------b82ebf8e-a046-4265-87c1-7e0cde9675dd--
)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()(class.module.classLoader.DefaultAssertio...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://app:3000/auth/login%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/auth/login (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('cmd.exe /C echo djlhad8ggmnp...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://app:3000/auth/login%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/auth/login (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('echo djlhad8ggmnph7mhvw48',$...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://app:3000/auth/login/
  * Node Name: `http://app:3000/auth/login/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://app:3000/computeMetadata/v1/
  * Node Name: `http://app:3000/computeMetadata/v1/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/health
  * Node Name: `http://app:3000/health ()(class.module.classLoader.DefaultAssertio...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/health%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/health (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('cmd.exe /C echo djlhad8ggmnp...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/health%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/health (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('echo djlhad8ggmnph7mhvw48',$...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/items
  * Node Name: `http://app:3000/items ()(aaa)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/items
  * Node Name: `http://app:3000/items ()(class.module.classLoader.DefaultAssertio...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/items
  * Node Name: `http://app:3000/items ()({name,description})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/items%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/items (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('cmd.exe /C echo djlhad8ggmnp...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/items%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/items (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('echo djlhad8ggmnph7mhvw48',$...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://app:3000/items/1
  * Node Name: `http://app:3000/items/1 ()(class.module.classLoader.DefaultAssertio...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/items/1%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/items/1 (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('cmd.exe /C echo djlhad8ggmnp...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/items/1%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/items/1 (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('echo djlhad8ggmnph7mhvw48',$...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/items/search%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/items/search (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('cmd.exe /C echo djlhad8ggmnp...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/items/search%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/items/search (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('echo djlhad8ggmnph7mhvw48',$...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/items/search%3Fq=Lap
  * Node Name: `http://app:3000/items/search (q)(class.module.classLoader.DefaultAssertio...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/latest/meta-data/
  * Node Name: `http://app:3000/latest/meta-data/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/metadata/instance
  * Node Name: `http://app:3000/metadata/instance ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/metadata/v1
  * Node Name: `http://app:3000/metadata/v1 ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/opc/v1/instance/
  * Node Name: `http://app:3000/opc/v1/instance/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/opc/v2/instance/
  * Node Name: `http://app:3000/opc/v2/instance/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/openstack/latest/meta_data.json
  * Node Name: `http://app:3000/openstack/latest/meta_data.json ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/ready
  * Node Name: `http://app:3000/ready ()(class.module.classLoader.DefaultAssertio...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/ready%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/ready (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('cmd.exe /C echo djlhad8ggmnp...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://app:3000/ready%3F-d+allow_url_include%253d1+-d+auto_prepend_file%253dphp://input
  * Node Name: `http://app:3000/ready (-d allow_url_include=1 -d auto_prepend_f...)(<?php exec('echo djlhad8ggmnph7mhvw48',$...)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``


Instances: 132

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (High)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`


Instances: 1

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://app:3000/health
  * Node Name: `http://app:3000/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://app:3000/items
  * Node Name: `http://app:3000/items`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://app:3000/items/search%3Fq=Lap
  * Node Name: `http://app:3000/items/search (q)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://app:3000/ready
  * Node Name: `http://app:3000/ready`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``

Instances: Systemic


### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3

### [ User Agent Fuzzer ](https://www.zaproxy.org/docs/alerts/10104/)



##### Informational (Medium)

### Description

Check for differences in response based on fuzzed User Agent (eg. mobile sites, access as a Search Engine Crawler). Compares the response statuscode and the hashcode of the response body with the original response.

* URL: http://app:3000/items
  * Node Name: `http://app:3000/items`
  * Method: `GET`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)`
  * Evidence: ``
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)`
  * Evidence: ``
  * Other Info: ``
* URL: http://app:3000/auth/login
  * Node Name: `http://app:3000/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)`
  * Evidence: ``
  * Other Info: ``
* URL: http://app:3000/items
  * Node Name: `http://app:3000/items ()({name,description})`
  * Method: `POST`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)`
  * Evidence: ``
  * Other Info: ``
* URL: http://app:3000/items
  * Node Name: `http://app:3000/items ()({name,description})`
  * Method: `POST`
  * Parameter: `Header User-Agent`
  * Attack: `Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)`
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


### Solution



### Reference


* [ https://owasp.org/www-project-web-security-testing-guide/ ](https://owasp.org/www-project-web-security-testing-guide/)



#### Source ID: 1


