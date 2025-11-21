<img src="app-icon.png" align="right" width="200px">

# 2sxc Extension Radmin App

> This is a JavaScript App for creating dynamic tables with [2sxc](https://2sxc.org) for [DNN ☢️](https://www.dnnsoftware.com/) and [Oqtane 💧](https://www.oqtane.org/)

This **2sxc Extension Radmin** app provides a powerful and flexible way to create, manage, and display tabular data in 2sxc apps. Built with TypeScript, it offers robust typing and modern JavaScript features for enhanced development experience.

| Aspect              | Status | Comments or Version
| ------------------- | :----: | -------------------
| 2sxc                | ✅    | requires 2sxc v19.00.00+
| Dnn                 | ✅    | For v9.6.1+
| Oqtane              | ✅    | Requires v5.00+
| No jQuery           | ✅    | Built with modern JavaScript
| TypeScript          | ✅    | Full TypeScript support
| Source & License    | ✅    | included, ISC/MIT
| Bootstrap 4         | ✅    | compatible
| Bootstrap 5         | ✅    | optimized
| Work in Progress    | ⚠️    | API may change

This means that it

1. can be used to create a simple and advanced tables in minutes
2. can be modified to fit any needs

The app is built with the [pattern **Don't be DAFT**][daft] (DAFT = Densely Abstract Features for Techies), aka the **Anti-Abstraction** pattern.
So customizing it is mostly done using common technologies like HTML, JS and some C#.

## Get Started

This app is only useful if you use DNN or Oqtane. So assuming you have a DNN installation, all you need to do is install 2sxc and this app.

* Here's how to [install 2sxc and an App of your Choice](https://2sxc.org/en/apps/app/mobius-forms-v5-with-mailchimp-recaptcha-polymorph-weback-and-more-hybrid-for-dnn-and-oqtane)

* Now you can use this app as-is, or customize it to be whatever you need it to be.

* It probably helps to review the [Overview][overview] about how the parts play together by default, so you can then change as little as necessary to get it to do what you want

3. Add the necessary HTML:

```html
<div id="my-table"></div>
```

## Customize the App

The Source Code is all here - so you can easily customize to your hearts desire!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## History

### 2025-11-20

1. 2pp: Generate AppCode with Copilot
1. 2pp: Update Schema Endpoint to include viewId for ViewAllowAnonymous check
1. 2dm: select content type - now a dropdown
1. 2dm: select query - now a dropdown
1. 2dm: create group `Data` and add instructions for data; auto-collapse if already specified but show show title with data info
1. 2dm: hide paging info if disabled
1. 2dm: advanced columns "group" for JS settings, as very advanced / exotic
1. 2dm: group `Column features`: collapse + info in title if edit/delete/add are enabled

### v0.1.0 (Work in Progress)

* Initial architecture and core features
* TypeScript implementation
* Basic table functionality
