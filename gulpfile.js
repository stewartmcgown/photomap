let gulp = require('gulp'), 
concat = require('gulp-concat'),
sass = require('gulp-sass'), 
babel = require('gulp-babel'), 
closureCompiler = require('gulp-closure-compiler');;

gulp.task('default', function () {
  gulp.run(['scripts', 'sass', 'sass:watch', 'scripts:watch'])
});

gulp.task('scripts', function () {
  return gulp.src(['./src/js/components/*.js', './src/js/Main.js'])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('sass', function () {
  return gulp.src('src/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist'));
});


gulp.task('sass:watch', function () {
  gulp.watch('src/**/*.scss', ['sass']);
});

gulp.task('scripts:watch', function () {
  gulp.watch('src/**/*.js', ['scripts']);
});