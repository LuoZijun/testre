#![feature(test, pattern)]

extern crate regex;
extern crate test;

use std::time::{Duration, Instant};

// 。 ． ｡  .
// ("\u3002", "\uFF0E", "\uFF61")
// "%2e", "%2E"

const CHARS: [char; 4] = ['\u{002E}', '\u{3002}', '\u{FF0E}', '\u{FF61}'];

enum State {
    Null,
    One,
    Two
}

fn split(input: &str, output: &mut Vec<String>) -> Duration {
    let now = Instant::now();

    let chars = input.chars();
    let mut buffer = String::new();

    let mut next_char_state = State::Null;
    
    for c in chars {
        if CHARS.contains(&c) {
            output.push(buffer.clone());
            buffer.clear();
        } else {
            match next_char_state {
                State::Null => {
                    if c == '%' {
                        next_char_state = State::One;
                    } else {
                        buffer.push(c);
                    }
                }
                State::One => {
                    if c == '2' {
                        next_char_state = State::Two;
                    } else {
                        buffer.push('%');
                        buffer.push(c);
                        next_char_state = State::Null;
                    }
                }
                State::Two => {
                    if c == 'e' || c == 'E' {
                        output.push(buffer.clone());
                        buffer.clear();
                        next_char_state = State::Null;
                    } else {
                        buffer.push('%');
                        buffer.push('2');
                        buffer.push(c);
                        next_char_state = State::Null;
                    }
                }
            };
        }
    }
    output.push(buffer.clone());
    drop(buffer);
    now.elapsed()
}

fn split2(input: &str, output: &mut Vec<String>) -> Duration {
    let now = Instant::now();
    output.extend(input.replace("%2e", ".").replace("%2E", ".")
        .split(|c| c == '\u{002E}' || c == '\u{3002}' || c == '\u{FF0E}' || c == '\u{FF61}')
        .map(|s| s.to_string())
        .collect::<Vec<String>>());
    now.elapsed()
}

// [\\.\u3002\uFF0E\uFF61]|%2e|%2E
fn get_regex() -> regex::Regex {
    regex::Regex::new("[\\.\u{3002}\u{FF0E}\u{FF61}]|%2e|%2E").unwrap()
}

fn re_split(input: &str, output: &mut Vec<String>, re: &regex::Regex) -> Duration {
    let now = Instant::now();
    output.extend(re.split(input)
        .map(|s| s.to_string())
        .collect::<Vec<String>>());
    now.elapsed()
}



fn main() {
    // let input = "abc。ef．g好%2E好吧";
    let input = "0xc0%2e0x00%2e0x02%2e0xeb";
    println!("Input: \"{}\"", input);

    let mut output: Vec<String> = Vec::new();
    let duration0 = split(input, &mut output);
    println!("[  Split] {:?} {:?}", output, duration0);
    
    output.clear();
    let duration1 = split2(input, &mut output);
    println!("[ Split2] {:?} {:?}", output, duration1);

    output.clear();
    let re = get_regex();
    let duration2 = re_split(input, &mut output, &re);
    println!("[ReSplit] {:?} {:?}", output, duration2);
}

#[cfg(test)]
mod tests {
    use super::*;
    use test::Bencher;

    #[test]
    fn it_works() {
        let input = "abc。ef．g好%2E好吧";
        let mut output: Vec<String> = Vec::new();

        split(input, &mut output);
        assert_eq!(vec!["abc".to_string(), "ef".to_string(), 
            "g好".to_string(), "好吧".to_string()], output);

        output.clear();
        let re = get_regex();
        re_split(input, &mut output, &re);
        assert_eq!(vec!["abc".to_string(), "ef".to_string(), 
            "g好".to_string(), "好吧".to_string()], output);

        output.clear();
        split2(input, &mut output);
        assert_eq!(vec!["abc".to_string(), "ef".to_string(), 
            "g好".to_string(), "好吧".to_string()], output);
    }
    
    #[bench]
    fn bench_split(b: &mut Bencher) {
        // let input = "abc。ef．g好%2E好吧";
        let input = "0xc0%2e0x00%2e0x02%2e0xeb";
        let mut output: Vec<String> = Vec::new();
        b.iter(|| {
            let _ = split(input, &mut output);
            output.clear();
        });
    }

    #[bench]
    fn bench_split2(b: &mut Bencher) {
        // let input = "abc。ef．g好%2E好吧";
        let input = "0xc0%2e0x00%2e0x02%2e0xeb";
        let mut output: Vec<String> = Vec::new();
        b.iter(|| {
            let _ = split2(input, &mut output);
            output.clear();
        });
    }

    #[bench]
    fn bench_re_split(b: &mut Bencher) {
        // let input = "abc。ef．g好%2E好吧";
        let input = "0xc0%2e0x00%2e0x02%2e0xeb";
        let re = get_regex();
        let mut output: Vec<String> = Vec::new();
        b.iter(|| {
            let _ = re_split(input, &mut output, &re);
            output.clear();
        });
    }
}