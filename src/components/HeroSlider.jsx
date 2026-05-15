import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesData } from '../data/articles';
import { useArticles } from '../context/ArticlesContext';
import { getArticleUrl } from '../utils/helpers';

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = articlesData.heroSlides;
  const navigate = useNavigate();
  const { findById } = useArticles();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index) => {
    let i = index;
    if (i < 0) i = slides.length - 1;
    if (i >= slides.length) i = 0;
    setCurrentSlide(i);
  };

  const handleReadMore = (slide) => {
    const article = findById(slide.articleId);
    if (article) navigate(getArticleUrl(article));
  };

  return (
    <div className="hero-slider" id="heroSlider">
      <div className="slider-container">
        {slides.map((slide, index) => (
          <div key={slide.id} className={`slide ${index === currentSlide ? 'active' : ''}`} data-slide={index}>
            <img src={slide.image} alt={slide.title} />
            <div className="slide-content">
              <h2>{slide.title}</h2>
              <p>{slide.description}</p>
              <button
                className="btn-read"
                onClick={() => handleReadMore(slide)}
              >
                Baca Selengkapnya →
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="slider-btn prev" onClick={() => goToSlide(currentSlide - 1)}>
        <i className="fas fa-chevron-left"></i>
      </button>
      <button className="slider-btn next" onClick={() => goToSlide(currentSlide + 1)}>
        <i className="fas fa-chevron-right"></i>
      </button>
      <div className="slider-dots">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          ></div>
        ))}
      </div>
    </div>
  );
}
