cd /home/hosting-user/youtube-dl
wget https://yt-dl.org/downloads/latest/youtube-dl
chmod a+rx /home/hosting-user/youtube-dl

wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz
tar xf ffmpeg-release-64bit-static.tar.xz
rm ffmpeg-release-64bit-static.tar.xz
mv ffmpeg-4.0.2-64bit-static/ffmpeg /home/hosting-user/ffmpeg
rm -rf ffmpeg-4.0.2-64bit-static/
