export function Config() {
  if (window.location.href.includes('localhost')) { 
    return 'http://localhost:9000'
  }
  return 'https://education.turbosify.com:9000'
}
