# gpx-snap

You have a GPX file with low resolution and timestamps. You have another GPX file, with high resolution and no
timestamps.

You want to snap the first GPX file to the second one, and interpolate the timestamps.

This little script attempts to do exactly that.

You may have to manually edit either input GPX file in order to get the correct results. For example, if either of the
GPX files has self-intersections, the script may not work properly.

This is a really simple implementation that I crafted in a couple of evenings. Don't expect much production quality.

## Why?

During my attempt at finishing the [Atlas Mountain Race 2023](http://atlasmountainrace.com/) my Garmin head unit
didn't record a part of my ride. The only track that I had was from a GPS satellite tracker, which recorded my location
once per several minutes.

I wanted to restore the lost part of my ride as close to reality as possible, so I've written this.

I used the GPX from my satellite tracker (the one with low resolution and timestamps),
and the official GPX track from the race organizers (the one with high resolution and no timestamps), fed those files to
this script, and got something as close to a real recorded GPS track as possible.

## Not a tech person?

I'm too lazy to write the precise instructions about the usage of this little piece of software, but if you really don't
understand how to run it, feel free to write me an e-mail, and I'll reply as soon as possible.