# Black Carbon Copy

This is an example of a [Bonjour/Zeroconf](http://www.zeroconf.org)
[Man-in-the-Middle
attack](https://en.wikipedia.org/wiki/Man-in-the-middle_attack). This
software showcases the attack of an
[IPP](https://en.wikipedia.org/wiki/Internet_Printing_Protocol) enabled
printer. It will intercept all print jobs sent to the target printer.

This attack only works for Bonjour/Zeroconf and IPP enabled printers.
Only jobs sent from clients that have the printer configured using
Bonjour/Zeroconf will have their jobs intercepted.

This software uses network conncted printers as an example target, but
the vulnerability is an inherent feature of the underlying Multicast DNS
standard ([RFC 6762](http://tools.ietf.org/html/rfc6762)) used by
Bonjour/Zeroconf, so all services relying on this standard may be
affected - not only printers.

[![Build status](https://travis-ci.org/watson/bcc.svg?branch=master)](https://travis-ci.org/watson/bcc)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

#### Solutions

Aside from disabling Bonjour/Zeroconf on the printer, one possible way
to secure your network from this sort of attack is by utilizing DNSSEC
([RFC 4033](http://tools.ietf.org/html/rfc4033)). How to do this is
beound the scope of this document.

## Disclaimer

Use this software only to test the vulnerability of your own network
printers. **Do not use this on networks you do not own without prior
permission.**

## Attack Explained

The attack relies on the fact that Bonjour/Zeroconf uses the Service
Instance Name of a service as the unique key. Clients configured to
connect to a service named `ServiceName` will do so even if the service
changes its host and port.

The attack works by forcing a name-change on the target service and
updating all clients to connect to a different service controlled by the
attacker:

1. An attacker advertises a service on the local network with the same
   properties as the target service except for the host and port which
   is replaced with its own
1. The target service will discover that another service is using its
   name and will rename itself to resolve the conflict (usually by
   appending a digit to the end of its name: `ServiceName` to
   `ServiceName-1`)
1. Simultaneously all clients on the network who've been configured to
   connect to `ServiceName` will now see that the service have changed
   host and port and will change their settings to connect to the new
   host/port controlled by the attacker
1. Since all requests to `ServiceName` are now sent to the attacker
   instead of the target, it can effectively act as a Man-in-the-Middle
   by proxying all requests to the target service

## Installation

This software is written in Node.js and can be installed using the npm
package manager. Ensure that you've [downloaded](https://nodejs.org) and
installed Node.js before continueing.

Install the `bcc` program globally:

```
npm install bcc -g
```

## Usage

Run `bcc` from the command line and select the target from the list of
printers displayed:

```
$ bcc
? Select a printer (use arrow keys)
> HP LaserJet 4600
  Reception Color Printer
```

A name-change will now be forced on the selected printer and the `bcc`
program will install it self as a proxy inbetween clients and the
selected printer.

When you quit the `bcc` program, no clients configured to connect to the
selected printer will be able to print any more as the proxy is now off
line and the actual printer have changed its name.

## License

MIT
