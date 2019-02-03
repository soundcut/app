cd /home/hosting-user

if [ -f youtube-dl ]; then
  ./youtube-dl -U
else
  wget https://yt-dl.org/downloads/latest/youtube-dl
  chmod a+rx /home/hosting-user/youtube-dl
fi

wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz
tar xf ffmpeg-release-64bit-static.tar.xz
rm ffmpeg-release-64bit-static.tar.xz
mv ffmpeg-*-64bit-static/ffmpeg ffmpeg
rm -rf ffmpeg-*-64bit-static/
