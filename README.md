beez-foundation
====

## About beez-foundation

スマートフォン向けブラウザアプリ開発を迅速に開発・リリースするためのローカルWebサーバーです。

## beez-foundationの特徴

beez-foundationの主な特徴は以下のような特徴を持っています。

### JSONをローカルに置いておくだけでRESTfulなAPIを提供

beez-foundationにはモックサーバの機能が内蔵されているので、APIの実装を待たずに開発が進められます。

JSONやObjectを返すJavaScriptファイルを記述するだけで、それらをモックデータとして使用しRESTful APIを提供することができます。

もうサーバの実装を待ってフロントの開発が止まる…ということはありません。

### 静的配信サーバ機能

beez-foundationでは、beezでの開発効率を上げるためにプレコンパイルが必要なファイルを自動でコンパイルしてブラウザではコンパイル後のファイルを使用して画面の確認ができるように設計されています。

- ローカルディレクトリパスを設定しておくだけで、ローカルのファイル/ディレクトリにHTTP経由でアクセスできます。
    - Mac OS付属の「Web 共有」と同等以上の機能を提供します。
- _handlebars_ (拡張子 : `.hbs`)を同一フォルダで _precompile_ (拡張子 : `.hbsc.js`) に自動変換します。
    - 拡張子を `.hbs`にするだけでコンパイルを意識せずに利用することができます。
- _stylus_ (拡張子 : `.styl`)を _stylesheet_ (拡張子 : `.css`) に自動変換します。
    - 拡張子を `.styl`にするだけでコンパイルを意識せずに利用することができます。

一度設定ファイルを記述すれば、あとはシームレスにCSSプリプロセッサやテンプレートエンジンを使うことができます。

### Install

```sh
$ npm install beez-foundation -g
$ beez-foundation -h

  Usage: beez-foundation [options]

  Options:

    -h, --help            output usage information
    -V, --version         output the version number
    -c --config <path>    server config path(format: json)
    -s --standalone       default configuration mode
    -d --debug            debug mode.
    -a --addmods <value>  I want to add a "/ m" module. It is more than one can be specified, separated by commas. format) -a dirname:absdirpath:from,... example) -a hoge:/tmp/hoge:
```


## Getting started

##### [ドキュメント](https://github.com/CyberAgent/beez-foundation/wiki)

```sh
$ cd {Web共有したいディレクトリパス}
$ beez-foundation -s
# open browser: http://0.0.0.0:1109
```




### ブラウザからのオペレーション

一度 `beez-foundation` が立ち上がれば、ブラウザから以下のような操作が簡単にできるので開発効率が上がります。

- ファイル/ディレクトリをブラウザから表示・操作することが可能です。
![static viewer](https://raw.github.com/CyberAgent/beez-foundation/master/design/beez-foundation.png)
- ビルド・デプロイなどのコマンドオペレーションをブラウザから操作することが可能です。
![operation](https://raw.github.com/CyberAgent/beez-foundation/master/design/beez-foundation_ops.png)
- モックデータをブラウザ上から確認する事が可能です。
![mock data viewer](https://raw.github.com/CyberAgent/beez-foundation/master/design/beez-foundation_mock.png)



## beez との連携

[beez](https://github.com/CyberAgent/beez)と連携することを前提として開発されています。

詳しくは [github : beez](https://github.com/CyberAgent/beez) を参照ください。


## Requirements

beez-foundationが依存しているライブラリは以下になります。

- [node.js](http://nodejs.org/)
- [beezlib](https://github.com/CyberAgent/beezlib)
- [bootstrap](http://twitter.github.io/bootstrap/)
- [bytes](https://npmjs.org/package/bytes)
- [colors](https://npmjs.org/package/colors)
- [commander](https://npmjs.org/package/commander)
- [handlebars](http://handlebarsjs.com/)
- [hbs](https://github.com/donpark/hbs)
- [moment](https://npmjs.org/package/moment)
- [pause](https://npmjs.org/package/pause)
- [send](https://npmjs.org/package/send)
- [RequireJS](http://requirejs.org/)
- [Stylus](http://learnboost.github.com/stylus/)
- [nib](https://github.com/visionmedia/nib)
- [Underscore.js](http://underscorejs.org/)
- [express](https://npmjs.org/package/express)
- [mocha](https://npmjs.org/package/mocha)
- [should](https://npmjs.org/package/should)
- [plato](https://github.com/jsoverson/plato)
- [jshint](https://npmjs.org/package/jshint)
- [jsdoc3](https://github.com/jsdoc3/jsdoc)
- [suns.js](https://github.com/CyberAgent/suns.js)
- [Zepto.js](http://zeptojs.com/)
- [jsonminify](https://github.com/fkei/JSON.minify)

> Versionについては、`package.json` を参照ください。一部はフロントのライブラリになります。

## Contributing

- Kei FUNAGAYAMA - [@fkei](https://twitter.com/fkei) [github](https://github.com/fkei)
- Kazuma MISHIMAGI - [@maginemu](https://twitter.com/maginemu) [github](https://github.com/maginemu)
- HIRAKI Satoru - [github](https://github.com/Layzie)
- Yuhei Aihara - [github](https://github.com/yuhei-a)

## Copyright

CyberAgent, Inc. All rights reserved.

## LICENSE

@see : [LICENSE](https://raw.github.com/CyberAgent/beez-foundation/master/LICENSE)

```
The MIT License (MIT)

Copyright © CyberAgent, Inc. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

```


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/CyberAgent/beez-foundation/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
